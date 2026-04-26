import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { EnvironmentVariables } from '../config/env.validation';
import { UserModel } from '../modules/user/models/user.model';
import { RoleModel } from '../modules/security/models/role.model';
import { PermissionModel } from '../modules/security/models/permission.model';
import { UserRoleModel } from '../modules/security/models/user-role.model';
import { PermissionRoleModel } from '../modules/security/models/permission-role.model';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '@workspace/shared-types';
import { PERMISSIONS_CONFIG, ROLES_CONFIG } from '../config/seed.config';
import { resolve } from 'path';

// Load env from apps/api/.env
dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });

const env = new EnvironmentVariables();
const permissionsConfig = PERMISSIONS_CONFIG;
const rolesConfig = ROLES_CONFIG;

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    entities: [
      UserModel,
      RoleModel,
      PermissionModel,
      UserRoleModel,
      PermissionRoleModel,
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const permissionRepo = dataSource.getRepository(PermissionModel);
    const roleRepo = dataSource.getRepository(RoleModel);
    const userRepo = dataSource.getRepository(UserModel);

    // Create/update permissions without clearing existing data
    console.log('📝 Syncing permissions...');
    const permissions: Record<string, PermissionModel> = {};
    for (const [name, description] of Object.entries(permissionsConfig)) {
      let permission = await permissionRepo.findOne({ where: { name } });
      if (!permission) {
        permission = permissionRepo.create({ name, description });
      } else if (permission.description !== description) {
        permission.description = description;
      }
      await permissionRepo.save(permission);
      permissions[name] = permission;
      console.log(`  ✓ Synced permission: ${name}`);
    }

    // Create/update roles and role-permission links without clearing existing data
    console.log('👥 Syncing roles...');
    const roles: Record<string, RoleModel> = {};
    for (const [name, config] of Object.entries(rolesConfig)) {
      let role = await roleRepo.findOne({ where: { name } });
      if (!role) {
        role = roleRepo.create({ name, description: config.description });
      } else if (role.description !== config.description) {
        role.description = config.description;
      }
      const savedRole = await roleRepo.save(role);

      // Assign permissions to role
      for (const permissionName of config.permissions) {
        const permission = permissions[permissionName];
        if (permission) {
          const existingPermissionRole = await dataSource.query(
            `
              SELECT id
              FROM "security"."permission_role"
              WHERE
                "permission_id" = $1
                AND
                "role_id" = $2
              LIMIT 1
            `,
            [permission.id, savedRole.id],
          );

          if (!existingPermissionRole.length) {
            await dataSource.query(
              `
                INSERT INTO "security"."permission_role"
                ("permission_id", "role_id")
                VALUES ($1, $2)
              `,
              [permission.id, savedRole.id],
            );
          }
        }
      }

      roles[name] = savedRole;
      console.log(`  ✓ Synced role: ${name}`);
    }

    // Ensure superuser exists (create only if missing)
    console.log('👨‍💼 Ensuring superuser exists...');
    let savedUser = await userRepo.findOne({ where: { email: env.FIRST_SUPERUSER_EMAIL } });
    if (!savedUser) {
      const hashedPassword = await bcrypt.hash(env.FIRST_SUPERUSER_PASSWORD, 10);
      const superuser = userRepo.create({
        email: env.FIRST_SUPERUSER_EMAIL,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Super',
        isActive: true,
      });
      savedUser = await userRepo.save(superuser);
      console.log(`  ✓ Created superuser: ${env.FIRST_SUPERUSER_EMAIL}`);
    } else {
      const passwordMatches = await bcrypt.compare(
        env.FIRST_SUPERUSER_PASSWORD,
        savedUser.password,
      );
      if (!passwordMatches) {
        savedUser.password = await bcrypt.hash(env.FIRST_SUPERUSER_PASSWORD, 10);
        await userRepo.save(savedUser);
        console.log(`  ✓ Updated superuser password from env: ${env.FIRST_SUPERUSER_EMAIL}`);
      }
      console.log(`  ✓ Superuser already exists: ${env.FIRST_SUPERUSER_EMAIL}`);
    }

    const superuserRole = roles[RoleEnum.SUPERUSER];
    if (!superuserRole) {
      throw new Error(`Role ${RoleEnum.SUPERUSER} was not created during seeding`);
    }

    const existingUserRole = await dataSource.query(
      `
        SELECT id
        FROM "security"."user_role"
        WHERE
          "user_id" = $1
          AND
          "role_id" = $2
        LIMIT 1
      `,
      [savedUser.id, superuserRole.id],
    );

    if (!existingUserRole.length) {
      await dataSource.query(
        `
          INSERT INTO "security"."user_role"
          ("user_id", "role_id")
          VALUES ($1, $2)
        `,
        [savedUser.id, superuserRole.id],
      );
      console.log(`  ✓ Assigned SUPERUSER role to: ${env.FIRST_SUPERUSER_EMAIL}`);
    } else {
      console.log(`  ✓ SUPERUSER role already assigned: ${env.FIRST_SUPERUSER_EMAIL}`);
    }

    console.log('✅ Database seed sync completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();



