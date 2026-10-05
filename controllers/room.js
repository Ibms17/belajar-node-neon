const roomService = require('../services/room.js');
const roomSchema = require('../validators/room.js');

// 1. CREATE Room
const create = async (req, res) => {
    // Validasi format input menggunakan Zod
    const validation = roomSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }
    // Ambil ownerId dari JWT Token (disuplai oleh middleware auth)
    const ownerId = req.user.id;

    // Kirim data ke service. Jika ada throw error di service, otomatis ditangkap global handler
    const newRoom = await roomService.createRoom({ ...validation.data, ownerId });

    return res.status(201).json({ success: true, message: "Tipe kamar berhasil dibuat", data: newRoom });
};

// 2. READ ALL Room
const getAll = async (req, res) => {
    const rooms = await roomService.getAllRoom(req.query);
    return res.status(200).json({ success: true, data: rooms });
};

// 3. READ ONE Room
const getById = async (req, res) => {
    const { id } = req.params; // ID berupa string UUID langsung (Tanpa fungsi Number)
    const room = await roomService.getRoomById(id);
    return res.status(200).json({ success: true, data: room });
};

// 4. UPDATE Room
const update = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const validation = roomSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Kirim ID Room, ownerId untuk cek kepemilikan, dan data baru ke service
    const updatedRoom = await roomService.updateRoom(id, ownerId, validation.data);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil diperbarui", data: updatedRoom });
};

// 5. DELETE Room
const destroy = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    await roomService.deleteRoom(id, ownerId);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil dihapus secara permanen" });
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    destroy
};