import type { User } from "@prisma/client";

export function toUserDTO(user: User) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}
