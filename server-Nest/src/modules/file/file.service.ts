import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  constructor(@Inject('MYSQL') private readonly mysql: any) {}

  private saveFile(payload: any): string {
    const uploadDir = path.join(__dirname, '../../../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(payload.file_name);
    const baseName = path.basename(payload.file_name, ext);
    const fileName = `${baseName}_${Date.now()}${ext}`;

    const destPath = path.join(uploadDir, fileName);

    if (payload.file?.buffer) {
      fs.writeFileSync(destPath, payload.file.buffer);
    } else if (payload.file?.path) {
      fs.copyFileSync(payload.file.path, destPath);
    } else {
      throw new Error('Không tìm thấy file');
    }

    return `uploads/${fileName}`;
  }

  async create(payload: any) {
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      let file_url: string | null = null;

      if (payload.file) {
        file_url = this.saveFile(payload);
      }

      const [fileResult] = await connection.execute(
        `INSERT INTO files (file_name, project_id, task_id, created_by)
         VALUES (?, ?, ?, ?)`,
        [
          payload.file_name,
          payload.project_id ?? null,
          payload.task_id ?? null,
          payload.created_by ?? null,
        ],
      );

      const fileId = fileResult.insertId;

      const fileType = path.extname(payload.file_name).replace('.', '');

      const [verResult] = await connection.execute(
        `INSERT INTO file_versions (file_id, version_number, file_url, file_type)
         VALUES (?, 1, ?, ?)`,
        [fileId, file_url, fileType],
      );

      await connection.commit();

      return {
        id: fileId,
        file_name: payload.file_name,
        versions: [
          {
            id: verResult.insertId,
            file_url,
            file_type: fileType,
          },
        ],
      };
    } catch (err) {
      await connection.rollback();
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      connection.release();
    }
  }

  async addVersion(fileId: number, payload: any) {
    const connection = await this.mysql.getConnection();

    try {
      await connection.beginTransaction();

      const [fileRows] = await connection.execute(
        'SELECT * FROM files WHERE id = ? AND deleted_at IS NULL',
        [fileId],
      );

      if (!fileRows.length) {
        throw new NotFoundException('File không tồn tại');
      }

      const file_url = this.saveFile(payload);

      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM file_versions WHERE file_id = ?',
        [fileId],
      );

      const version = countRows[0].count + 1;

      const [verResult] = await connection.execute(
        `INSERT INTO file_versions (file_id, version_number, file_url)
         VALUES (?, ?, ?)`,
        [fileId, version, file_url],
      );

      await connection.commit();

      return {
        id: verResult.insertId,
        version,
        file_url,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async findAll(filter: any) {
    let sql = `
      SELECT
        f.*,
        (
          SELECT JSON_OBJECT(
            'id', fv.id,
            'file_id', fv.file_id,
            'version_number', fv.version_number,
            'file_url', fv.file_url,
            'file_type', fv.file_type
          )
          FROM file_versions fv
          WHERE fv.file_id = f.id
          ORDER BY fv.version_number DESC
          LIMIT 1
        ) AS latest_version
      FROM files f
      WHERE f.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (filter.id) {
      sql += ' AND f.id LIKE ?';
      params.push(`%${filter.id}%`);
    }
    if (filter.file_name) {
      sql += ' AND f.file_name LIKE ?';
      params.push(`%${filter.file_name}%`);
    }
    if (filter.project_id) {
      sql += ' AND f.project_id = ?';
      params.push(filter.project_id);
    }
    if (filter.task_id) {
      sql += ' AND f.task_id = ?';
      params.push(filter.task_id);
    }
    if (filter.created_by) {
      sql += ' AND f.created_by = ?';
      params.push(filter.created_by);
    }

    const [rows] = await this.mysql.execute(sql, params);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    for (const file of rows) {
      if (typeof file.latest_version === 'string') {
        try {
          file.latest_version = JSON.parse(file.latest_version);
        } catch {
          file.latest_version = null;
        }
      }
      if (file.latest_version?.file_url) {
        file.latest_version.file_url = `${baseUrl}/${file.latest_version.file_url.replace(/\\/g, '/')}`;
      }
    }

    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.mysql.execute(
      `SELECT * FROM files WHERE id = ?`,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException('File không tồn tại');
    }

    const file = rows[0];
    const [versions] = await this.mysql.execute(
      'SELECT * FROM file_versions WHERE file_id = ? AND deleted_at IS NULL',
      [id],
    );
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    file.versions = versions.map((version) => ({
      ...version,
      file_url: version.file_url
        ? `${baseUrl}/${version.file_url.replace(/\\/g, '/')}`
        : null,
    }));

    return file;
  }

  async getAvatar(userId: number) {
    const [rows] = await this.mysql.execute(
      `SELECT id, avatar_url FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId],
    );

    if (!rows.length) {
      return null;
    }

    const user = rows[0];
    return {
      avatar_url: user.avatar_url || null,
    };
  }

  async uploadAvatar(userId: number, payload: any) {
    // Verify user exists
    const [userRows] = await this.mysql.execute(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [userId],
    );

    if (!userRows.length) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với id = ${userId}`,
      );
    }

    // Save file to uploads folder
    const fileUrl = this.saveFile(payload);

    // Return file URL - AccountController/AccountService will handle updating users.avatar_url
    return { file_url: fileUrl };
  }

  async findAllVersion(id: number) {
    const [rows] = await this.mysql.execute(
      'SELECT * FROM file_versions WHERE file_id = ? AND deleted_at IS NULL ORDER BY version_number ASC',
      [id],
    );
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    return rows.map((version) => ({
      ...version,
      file_url: version.file_url
        ? `${baseUrl}/${version.file_url.replace(/\\/g, '/')}`
        : null,
    }));
  }

  async findVersion(versionId: number) {
    const [rows] = await this.mysql.execute(
      'SELECT * FROM file_versions WHERE id = ? AND deleted_at IS NULL',
      [versionId],
    );
    return rows[0] || null;
  }

  async update(id: number, payload: any) {
    const allowed = ['file_name', 'project_id', 'task_id'];
    const fields: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (Object.hasOwn(payload, key)) {
        fields.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }

    if (!fields.length) return this.findOne(id);

    await this.mysql.execute(
      `UPDATE files SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id],
    );
    return this.findOne(id);
  }

  async delete(id: number) {
    const file = await this.findOne(id);
    await this.mysql.execute('UPDATE files SET deleted_at = ? WHERE id = ?', [
      new Date(),
      id,
    ]);
    return file;
  }

  async getRole(fileId: number, userId: number) {
    const [rows] = await this.mysql.execute(
      `
      SELECT
        CASE WHEN f.created_by = ? THEN TRUE ELSE FALSE END AS isCreator,
        CASE WHEN ta.id IS NOT NULL THEN TRUE ELSE FALSE END AS isAssigned
      FROM files f
      LEFT JOIN task_assignees ta
        ON f.task_id = ta.task_id
        AND ta.user_id = ?
        AND ta.deleted_at IS NULL
      WHERE f.id = ?
        AND f.deleted_at IS NULL
      LIMIT 1
      `,
      [userId, userId, fileId],
    );

    return rows[0] || { isCreator: false, isAssigned: false };
  }
}
