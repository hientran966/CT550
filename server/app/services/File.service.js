const fs = require('fs');
const path = require('path');

class FileService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractFileData(payload) {
        return {
            file_name: payload.file_name ?? null,
            project_id: payload.project_id ?? null,
            task_id: payload.task_id ?? null,
            created_by: payload.created_by ?? null,
        };
    }

    async extractVersionData(payload) {
        return {
            file_id: payload.file_id ?? null,
            version_number: payload.version_number ?? null,
            file_url: payload.file_url ?? null,
            status: payload.status ?? "Chờ duyệt",
            file_type: payload.file_type ?? null,
        };
    }

    async saveFileFromPayload(payload) {
        const { file_name, file } = payload;
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(file_name);
        const baseName = path.basename(file_name, ext);
        const uniqueName = `${baseName}_${Date.now()}${ext}`;
        const destPath = path.join(uploadsDir, uniqueName);

        fs.copyFileSync(file, destPath);

        return path.join('uploads', uniqueName);
    }

    async create(payload) {
        const file = await this.extractFileData(payload);
        const version = await this.extractVersionData(payload);

        if (!payload.file_name || typeof payload.file_name !== 'string') {
            throw new Error("Tên file không hợp lệ.");
        }

        let fileType = null;
        if (payload.file_name) {
            fileType = path.extname(payload.file_name).replace('.', '').toLowerCase();
            version.file_type = fileType;
        }

        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            let file_url = null;
            if (payload.file && payload.file_name) {
                file_url = await this.saveFileFromPayload(payload);
            }
            version.file_url = file_url;

            const [fileResult] = await connection.execute(
                "INSERT INTO files (file_name, project_id, task_id, created_by) VALUES (?, ?, ?, ?)",
                [file.file_name, file.project_id, file.task_id, file.created_by]
            );

            const fileId = fileResult.insertId;

            const [verCountRows] = await connection.execute(
                "SELECT COUNT(*) as count FROM file_versions WHERE file_id = ? AND deleted_at IS NULL",
                [fileId]
            );
            version.version_number = verCountRows[0].count + 1;

            const [verResult] = await connection.execute(
                "INSERT INTO file_versions (version_number, file_url, file_type, status, file_id) VALUES (?, ?, ?, ?, ?)",
                [
                    version.version_number,
                    version.file_url,
                    version.file_type,
                    version.status,
                    fileId
                ]
            );

            await connection.commit();
            return { ...file, file_url: version.file_url, file_id: fileId, idVersion: verResult.insertId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM files WHERE deleted_at IS NULL";
        let params = [];
        if (filter.file_name) {
            sql += " AND file_name LIKE ?";
            params.push(`%${filter.file_name}%`);
        }
        if (filter.project_id) {
            sql += " AND project_id = ?";
            params.push(filter.project_id);
        }
        if (filter.task_id) {
            sql += " AND task_id = ?";
            params.push(filter.task_id);
        }
        if (filter.created_by) {
            sql += " AND created_by = ?";
            params.push(filter.created_by);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM files WHERE id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async findVersion(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM file_versions WHERE file_id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows || null;
    }

    async findVersionById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM file_versions WHERE id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const file = await this.extractFileData(payload);
        let sql = "UPDATE files SET ";
        const fields = [];
        const params = [];
        for (const key in file) {
            if (key === 'id') continue;
            fields.push(`${key} = ?`);
            params.push(file[key]);
        }
        sql += fields.join(", ") + " WHERE id = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...file };
    }

    async addVersion(id, payload) {
        if (!payload) throw new Error("Thiếu payload khi thêm phiên bản file.");

        let file_url = null;
        if (payload.file && payload.file_name) {
            file_url = await this.saveFileFromPayload(payload);
        }

        const version = await this.extractVersionData(payload);
        version.file_url = file_url;

        const [verCountRows] = await this.mysql.execute(
            "SELECT COUNT(*) as count FROM file_versions WHERE file_id = ? AND deleted_at IS NULL",
            [id]
        );
        version.version_number = verCountRows[0].count + 1;

        const [verResult] = await this.mysql.execute(
            "INSERT INTO file_versions (version_number, file_url, status, file_id) VALUES (?, ?, ?, ?)",
            [
                version.version_number,
                version.file_url,
                version.status,
                id
            ]
        );

        return { ...version, file_id: id };
    }

    async updateVersion(id, payload) {
        const version = await this.extractVersionData(payload);
        let sql = "UPDATE file_versions SET ";
        const fields = [];
        const params = [];
        for (const key in version) {
            if (key === 'id') continue;
            fields.push(`${key} = ?`);
            params.push(version[key]);
        }
        sql += fields.join(", ") + " WHERE id = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...version };
    }

    async delete(id) {
        const deleteAt = new Date();
        await this.mysql.execute(
            "UPDATE files SET deleted_at = ? WHERE id = ?",
            [deleteAt, id]
        );
        return id;
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE files SET deleted_at = NULL WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async updateAvatar(idNguoiDung, payload) {
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            // Tạo bản ghi file
            const file = await this.extractFileData(payload);
            const version = await this.extractVersionData(payload);

            if (!payload.file_name || typeof payload.file_name !== 'string') {
                throw new Error("Tên file không hợp lệ.");
            }

            let file_url = null;
            if (payload.file && payload.file_name) {
                file_url = await this.saveFileFromPayload(payload);
            }
            version.file_url = file_url;

            const [fileResult] = await connection.execute(
                "INSERT INTO files (file_name, created_by) VALUES (?, ?)",
                [file.file_name, idNguoiDung]
            );
            const fileId = fileResult.insertId;

            // Thêm phiên bản
            version.version_number = 1;
            const [verResult] = await connection.execute(
                "INSERT INTO file_versions (version_number, file_url, status, file_id) VALUES (?, ?, ?, ?)",
                [version.version_number, version.file_url, version.status, fileId]
            );

            // Cập nhật avatar cho tài khoản
            await connection.execute(
                "UPDATE users SET avatar = ? WHERE id = ?",
                [fileId, idNguoiDung]
            );

            await connection.commit();
            return { fileId, versionId: verResult.insertId, file_url: version.file_url };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = FileService;