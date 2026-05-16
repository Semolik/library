import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import { EnvironmentVariables } from '../../config/env.validation';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly client: Client;

  constructor(private readonly env: EnvironmentVariables) {
    this.client = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async onModuleInit() {
    const bucketExists = await this.client.bucketExists(this.env.MINIO_BUCKET_NAME);
    if (!bucketExists) {
      await this.client.makeBucket(this.env.MINIO_BUCKET_NAME);
    }
  }

  async uploadBookCover(
    bookId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<string> {
    const extension = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : 'bin';
    const objectName = `books/${bookId}/cover.${extension}`;
    await this.client.putObject(
      this.env.MINIO_BUCKET_NAME,
      objectName,
      file.buffer,
      file.buffer.length,
      { 'Content-Type': file.mimetype },
    );
    return objectName;
  }

  async getPresignedUrl(objectName: string): Promise<string> {
    return this.client.presignedGetObject(this.env.MINIO_BUCKET_NAME, objectName, 60 * 60);
  }

  async uploadAuthorPhoto(
    authorId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<string> {
    const extension = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : 'bin';
    const objectName = `authors/${authorId}/photo.${extension}`;
    await this.client.putObject(
      this.env.MINIO_BUCKET_NAME,
      objectName,
      file.buffer,
      file.buffer.length,
      { 'Content-Type': file.mimetype },
    );
    return objectName;
  }

  async findAuthorPhotoObjectName(authorId: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const stream = this.client.listObjectsV2(this.env.MINIO_BUCKET_NAME, `authors/${authorId}/`, true);
      let found: string | null = null;

      stream.on('data', (item) => {
        if (!found && item.name && item.name.includes('/photo.')) {
          found = item.name;
        }
      });
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve(found));
    });
  }

  /** Удаляет объекты MinIO для автора (портрет). */
  async removeAuthorObjects(authorId: string): Promise<void> {
    const prefix = `authors/${authorId}/`;
    const names: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = this.client.listObjectsV2(this.env.MINIO_BUCKET_NAME, prefix, true);
      stream.on('data', (item) => {
        if (item.name) {
          names.push(item.name);
        }
      });
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve());
    });
    if (names.length === 0) {
      return;
    }
    await this.client.removeObjects(this.env.MINIO_BUCKET_NAME, names);
  }

  async findBookCoverObjectName(bookId: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const stream = this.client.listObjectsV2(this.env.MINIO_BUCKET_NAME, `books/${bookId}/`, true);
      let found: string | null = null;

      stream.on('data', (item) => {
        if (!found && item.name && item.name.includes('/cover.')) {
          found = item.name;
        }
      });
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve(found));
    });
  }

  /** Удаляет все объекты в MinIO под префиксом книги (обложки и т.п.). */
  async removeBookObjects(bookId: string): Promise<void> {
    const prefix = `books/${bookId}/`;
    const names: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = this.client.listObjectsV2(this.env.MINIO_BUCKET_NAME, prefix, true);
      stream.on('data', (item) => {
        if (item.name) {
          names.push(item.name);
        }
      });
      stream.on('error', (error) => reject(error));
      stream.on('end', () => resolve());
    });
    if (names.length === 0) {
      return;
    }
    await this.client.removeObjects(this.env.MINIO_BUCKET_NAME, names);
  }
}
