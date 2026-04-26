import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from './models/user.model';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}

