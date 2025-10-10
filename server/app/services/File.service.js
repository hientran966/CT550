const fs = require("fs");
const path = require("path");

class FileService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async saveFileFromPayload(payload) {
        const uploadDir = path.join(__dirname, "../../uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        let sourcePath;
        if (payload.file?.path) {
            sourcePath = payload.file.path;
        } else if (typeof payload.file === "string" && fs.existsSync(payload.file)) {
            sourcePath = payload.file;
        } else {
            throw new Error("Không tìm thấy file để lưu.");
        }

        const ext = path.extname(payload.file_name);
        const baseName = path.basename(payload.file_name, ext);
        const uniqueName = `${baseName}_${Date.now()}${ext}`;
        const destPath = path.join(uploadDir, uniqueName);

        fs.copyFileSync(sourcePath, destPath);

        return path.join("uploads", uniqueName);
    }

    async create(payload) {
        if (!payload.file_name || typeof payload.file_name !== "string") {
            throw new Error("Tên file không hợp lệ.");
        }

        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            let file_url = null;
            if (payload.file) {
                file_url = await this.saveFileFromPayload(payload);
            }

            const fileType = path.extname(payload.file_name)
                .replace(".", "")
                .toLowerCase();

            const [fileResult] = await connection.execute(
                `INSERT INTO files (file_name, project_id, task_id, created_by)
                 VALUES (?, ?, ?, ?)`,
                [payload.file_name, payload.project_id ?? null, payload.task_id ?? null, payload.created_by ?? null]
            );
            const fileId = fileResult.insertId;

            const [verResult] = await connection.execute(
                `INSERT INTO file_versions (file_id, version_number, file_url, file_type, status)
                 VALUES (?, 1, ?, ?, 'Hoạt động')`,
                [fileId, file_url, fileType]
            );

            await connection.commit();
            return { file_id: fileId, version_id: verResult.insertId, file_url };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updateAvatar(userId, payload) {
        const connection = await this.mysql.getConnection();
        try {
            await connection.beginTransaction();

            const file_url = await this.saveFileFromPayload(payload);
            const fileType = path.extname(payload.file_name).replace(".", "").toLowerCase();

            const [rows] = await connection.execute(
                `SELECT id FROM files 
                 WHERE created_by = ? AND project_id IS NULL AND task_id IS NULL 
                 AND deleted_at IS NULL AND category = 'user_avatar'`,
                [userId]
            );

            let fileId;

            if (rows.length > 0) {
                fileId = rows[0].id;
                const [verCount] = await connection.execute(
                    `SELECT COUNT(*) as count FROM file_versions WHERE file_id = ? AND deleted_at IS NULL`,
                    [fileId]
                );
                const version = verCount[0].count + 1;

                await connection.execute(
                    `INSERT INTO file_versions (file_id, version_number, file_url, file_type, status)
                     VALUES (?, ?, ?, ?, 'Hoạt động')`,
                    [fileId, version, file_url, fileType]
                );
            } else {
                const [fileRes] = await connection.execute(
                    `INSERT INTO files (category, created_by, project_id, task_id)
                     VALUES ('user_avatar', ?, NULL, NULL)`,
                    [userId]
                );
                fileId = fileRes.insertId;

                await connection.execute(
                    `INSERT INTO file_versions (file_id, version_number, file_url, file_type, status)
                     VALUES (?, 1, ?, ?, 'Hoạt động')`,
                    [fileId, file_url, fileType]
                );
            }

            await connection.commit();
            return { file_id: fileId, file_url };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async getAvatar(userId) {
        const [rows] = await this.mysql.execute(
            `SELECT fv.file_url, fv.file_type, fv.created_at
            FROM files f
            JOIN file_versions fv ON fv.file_id = f.id
            WHERE f.created_by = ? AND f.category = 'user_avatar' AND fv.deleted_at IS NULL
            ORDER BY fv.version_number DESC
            LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) return null;

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const file = rows[0];
        file.file_url = `${baseUrl}/${file.file_url.replace(/\\/g, '/')}`;

        return file;
    }

    async find(filter = {}) {
        let sql = `
            SELECT 
                f.*,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', fv.id,
                            'file_id', fv.file_id,
                            'version_number', fv.version_number,
                            'file_url', fv.file_url,
                            'file_type', fv.file_type,
                            'status', fv.status
                        )
                    )
                    FROM file_versions fv
                    WHERE fv.file_id = f.id
                ) AS versions
            FROM files f
            WHERE f.deleted_at IS NULL
        `;

        const params = [];

        if (filter.id) {
            sql += " AND f.id LIKE ?";
            params.push(`%${filter.id}%`);
        }

        if (filter.file_name) {
            sql += " AND f.file_name LIKE ?";
            params.push(`%${filter.file_name}%`);
        }

        if (filter.project_id) {
            sql += " AND f.project_id = ?";
            params.push(filter.project_id);
        }

        if (filter.task_id) {
            sql += " AND f.task_id = ?";
            params.push(filter.task_id);
        }

        if (filter.created_by) {
            sql += " AND f.created_by = ?";
            params.push(filter.created_by);
        }
        const [rows] = await this.mysql.execute(sql, params);
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        for (const file of rows) {
            if (typeof file.versions === 'string') {
                try {
                    file.versions = JSON.parse(file.versions);
                } catch (err) {
                    file.versions = [];
                }
            }

            if (Array.isArray(file.versions)) {
                file.versions = file.versions.map(v => ({
                    ...v,
                    file_url: v.file_url
                        ? `${baseUrl}/${v.file_url.replace(/\\/g, '/')}`
                        : null
                }));
            }
        }
        return rows;
    }

    async findVersion(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM file_versions WHERE file_id = ? AND deleted_at IS NULL",
            [id]
        );
        return rows;
    }
}

module.exports = FileService;