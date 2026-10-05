const kosService = require('../services/kos.js');
const kosSchema = require('../validators/kos.js');

// 1. CREATE KOS
const create = async (req, res) => {
    // Validasi format input menggunakan Zod
    const validation = kosSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Ambil ownerId dari JWT Token (disuplai oleh middleware auth)
    const ownerId = req.user.id;

    // Kirim data ke service. Jika ada throw error di service, otomatis ditangkap global handler
    const newKos = await kosService.createKos({ ...validation.data, ownerId });

    return res.status(201).json({ success: true, message: "Kos berhasil dibuat", data: newKos });
};

// 2. READ ALL KOS
const getAll = async (req, res) => {
    const koss = await kosService.getAllKos(req.query);
    return res.status(200).json({ success: true, data: koss });
};

// 3. READ ONE KOS
const getById = async (req, res) => {
    const { id } = req.params; // ID berupa string UUID langsung (Tanpa fungsi Number)
    const kos = await kosService.getKosById(id);
    return res.status(200).json({ success: true, data: kos });
};

// 4. UPDATE KOS
const update = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const validation = kosSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Kirim ID kos, ownerId untuk cek kepemilikan, dan data baru ke service
    const updatedKos = await kosService.updateKos(id, ownerId, validation.data);
    return res.status(200).json({ success: true, message: "Kos berhasil diperbarui", data: updatedKos });
};

// 5. DELETE KOS
const destroy = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    await kosService.deleteKos(id, ownerId);
    return res.status(200).json({ success: true, message: "Kos berhasil dihapus secara permanen" });
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    destroy
};