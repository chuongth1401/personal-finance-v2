import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // /login, /register không cần đăng nhập và không gọi API được bảo vệ nên vẫn prerender được.
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  // Mọi route còn lại (dashboard, transactions, budgets, goals, analytics, reports,
  // settings...) đều yêu cầu đăng nhập - không thể prerender lúc build vì chưa có
  // token, nên chuyển sang render phía client sau khi đã xác thực.
  { path: '**', renderMode: RenderMode.Client },
];
