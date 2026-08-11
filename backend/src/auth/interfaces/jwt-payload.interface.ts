/** Payload được mã hoá trong access token. `sub` là userId theo chuẩn JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
}
