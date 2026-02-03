import { Controller, Post, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: {
      limit: 5,
      ttl: 60,
    },
  })
  @Post("login")
  async login(
    @Body() body: { email: string; password: string }
  ) {
    return this.authService.login(body.email, body.password);
  }

  @Post("refresh")
  async refresh(
    @Body() body: { refresh_token: string }
  ) {
    return this.authService.refresh(body.refresh_token);
  }
}
