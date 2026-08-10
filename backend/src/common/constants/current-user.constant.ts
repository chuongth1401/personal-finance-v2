/**
 * TODO(auth): chưa có xác thực thật. Toàn bộ request hiện dùng cố định
 * user demo này. Khi thêm JWT, thay các chỗ dùng DEMO_USER_ID bằng
 * userId lấy từ request đã xác thực (vd. qua @CurrentUser() decorator
 * đọc từ req.user do JwtAuthGuard gắn vào).
 */
export const DEMO_USER_ID = 'demo-user';
