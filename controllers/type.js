const typeService = require('../services/type.js');
const typeSchema = require('../validators/type.js');

// 1. CREATE type
const create = async (req, res) => {
    // Validasi format input menggunakan Zod
    const validation = typeSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Ambil ownerId dari JWT Token (disuplai oleh middleware auth)
    const ownerId = req.user.id;

    // Kirim data ke service. Jika ada throw error di service, otomatis ditangkap global handler
    const newType = await typeService.createType({ ...validation.data, ownerId });

    return res.status(201).json({ success: true, message: "Tipe kamar berhasil dibuat", data: newType });
};

// 2. READ ALL type
const getAll = async (req, res) => {
    const types = await typeService.getAllType(req.query);
    return res.status(200).json({ success: true, data: types });
};

// 3. READ ONE type
const getById = async (req, res) => {
    const { id } = req.params; // ID berupa string UUID langsung (Tanpa fungsi Number)
    const type = await typeService.getTypeById(id);
    return res.status(200).json({ success: true, data: type });
};

// 4. UPDATE type
const update = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const validation = typeSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Kirim ID type, ownerId untuk cek kepemilikan, dan data baru ke service
    const updatedType = await typeService.updateType(id, ownerId, validation.data);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil diperbarui", data: updatedType });
};

// 5. DELETE type
const destroy = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    await typeService.deleteType(id, ownerId);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil dihapus secara permanen" });
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    destroy
};