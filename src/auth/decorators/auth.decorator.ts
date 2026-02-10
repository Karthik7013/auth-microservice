import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/entities/user.entity";

/**
 * Public route decorator - skips JWT authentication
 */
export const Public = () => SetMetadata("isPublic", true);

/**
 * Roles decorator for role-based access control
 */
export const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles);
