import { PermissionEnum, RoleEnum } from '@workspace/shared-types';

export const PERMISSIONS_CONFIG = {
  [PermissionEnum.USER_CREATE]: 'Create users',
  [PermissionEnum.USER_READ]: 'Read users',
  [PermissionEnum.USER_UPDATE]: 'Update users',
  [PermissionEnum.USER_DELETE]: 'Delete users',
  [PermissionEnum.USER_LIST]: 'List users',
  [PermissionEnum.ROLE_CREATE]: 'Create roles',
  [PermissionEnum.ROLE_READ]: 'Read roles',
  [PermissionEnum.ROLE_UPDATE]: 'Update roles',
  [PermissionEnum.ROLE_DELETE]: 'Delete roles',
  [PermissionEnum.ROLE_LIST]: 'List roles',
  [PermissionEnum.PERMISSION_CREATE]: 'Create permissions',
  [PermissionEnum.PERMISSION_READ]: 'Read permissions',
  [PermissionEnum.PERMISSION_UPDATE]: 'Update permissions',
  [PermissionEnum.PERMISSION_DELETE]: 'Delete permissions',
  [PermissionEnum.PERMISSION_LIST]: 'List permissions',
};

export const ROLES_CONFIG = {
  [RoleEnum.SUPERUSER]: {
    description:
      'Суперпользователь: технический полный доступ ко всем операциям и правам',
    permissions: Object.values(PermissionEnum),
  },
  [RoleEnum.ADMIN]: {
    description:
      'Администратор библиотеки: регистрация читателей и персонала с ролями, управление пользователями и ролями',
    permissions: [
      PermissionEnum.USER_CREATE,
      PermissionEnum.USER_READ,
      PermissionEnum.USER_UPDATE,
      PermissionEnum.USER_DELETE,
      PermissionEnum.USER_LIST,
      PermissionEnum.ROLE_CREATE,
      PermissionEnum.ROLE_READ,
      PermissionEnum.ROLE_UPDATE,
      PermissionEnum.ROLE_DELETE,
      PermissionEnum.ROLE_LIST,
      PermissionEnum.PERMISSION_READ,
      PermissionEnum.PERMISSION_LIST,
    ],
  },
  [RoleEnum.LIBRARIAN]: {
    description:
      'Библиотекарь: экземпляры, выдача и возврат, штрафы; регистрация читателей; без ведения справочников и карточек книг',
    permissions: [
      PermissionEnum.USER_CREATE,
      PermissionEnum.USER_READ,
      PermissionEnum.USER_UPDATE,
      PermissionEnum.USER_DELETE,
      PermissionEnum.USER_LIST,
    ],
  },
  [RoleEnum.USER]: {
    description: 'Читатель: каталог, личный кабинет, история выдач',
    permissions: [],
  },
};

