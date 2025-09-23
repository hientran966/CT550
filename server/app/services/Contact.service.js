class ContactService {
    constructor(mysql) {
        this.mysql = mysql;
    }

    async extractContactData(payload) {
        const contact = {
            ownerId: payload.ownerId ?? null,
            contactId: payload.contactId ?? null,
            deactive: payload.deactive ?? null,
        };
        Object.keys(contact).forEach((key) => {
            if (contact[key] === undefined) delete contact[key];
        });
        return contact;
    }

    async create(payload) {
        if (!payload.ownerId) throw new Error("Cần có ownerId");
        if (!payload.contactId) throw new Error("Cần có contactId");

        const [exist] = await this.mysql.execute(
            "SELECT * FROM LienHe WHERE ownerId = ? AND contactId = ? AND deactive IS NULL",
            [payload.ownerId, payload.contactId]
        );
        if (exist.length > 0) throw new Error("Liên hệ đã tồn tại");

        const contact = await this.extractContactData(payload);
        const [result] = await this.mysql.execute(
            "INSERT INTO LienHe (ownerId, contactId, deactive) VALUES (?, ?, ?)",
            [contact.ownerId, contact.contactId, contact.deactive]
        );
        const autoId = result.insertId;
        const newId = "CT" + autoId.toString().padStart(6, "0");
        await this.mysql.execute(
            "UPDATE LienHe SET id = ? WHERE autoId = ?",
            [newId, autoId]
        );
        return { id: newId, ...contact };
    }

    async find(filter = {}) {
        let sql = "SELECT * FROM LienHe WHERE deactive IS NULL";
        const params = [];
        if (filter.ownerId) {
            sql += " AND ownerId = ?";
            params.push(filter.ownerId);
        }
        if (filter.contactId) {
            sql += " AND contactId = ?";
            params.push(filter.contactId);
        }
        const [rows] = await this.mysql.execute(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await this.mysql.execute(
            "SELECT * FROM LienHe WHERE autoId = ? AND deactive IS NULL",
            [id]
        );
        return rows[0] || null;
    }

    async update(id, payload) {
        const contact = await this.extractContactData(payload);
        let sql = "UPDATE LienHe SET ";
        const fields = [];
        const params = [];
        for (const key in contact) {
            if (key === "id") continue;
            fields.push(`${key} = ?`);
            params.push(contact[key]);
        }
        sql += fields.join(", ") + " WHERE autoId = ?";
        params.push(id);
        await this.mysql.execute(sql, params);
        return { ...contact, id };
    }

    async delete(id) {
        const contact = await this.findById(id);
        if (!contact) return null;
        const deletedAt = new Date();
        await this.mysql.execute(
            "UPDATE LienHe SET deactive = ? WHERE autoId = ?",
            [deletedAt, id]
        );
        return { ...contact, deactive: deletedAt };
    }

    async restore(id) {
        const [result] = await this.mysql.execute(
            "UPDATE LienHe SET deactive = NULL WHERE autoId = ?",
            [id]
        );
        return result.affectedRows > 0;
    }

    async deleteAll() {
        const deletedAt = new Date();
        await this.mysql.execute("UPDATE LienHe SET deactive = ?", [deletedAt]);
        return true;
    }
}

module.exports = ContactService;