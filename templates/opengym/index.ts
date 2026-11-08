import { Output, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // API: passkey auth, per-user JSON state, push notifications.
  // Not exposed directly - the web container proxies /api to it (single origin,
  // required for passkeys).
  services.push({
    type: "app",
    data: {
      serviceName: `${input.appServiceName}-api`,
      source: {
        type: "image",
        image: input.apiServiceImage,
      },
      env: [
        `RP_ID=$(EASYPANEL_DOMAIN)`,
        `ORIGIN=https://$(EASYPANEL_DOMAIN)`,
        `PORT=3000`,
        `DATA_DIR=/data`,
        `TRUST_PROXY=1`,
        // Optional switches - uncomment and rebuild the service to apply:
        // FIRST_USER_ADMIN=1
        // INVITE_ONLY=1
        // ALLOW_GUEST=0
        // PASSWORD_LOGIN=1
        // ADMIN_UIDS=
      ].join("\n"),
      mounts: [
        {
          type: "volume",
          name: "data",
          mountPath: "/data",
        },
        {
          type: "volume",
          name: "coach-auth",
          mountPath: "/coach-auth",
        },
      ],
    },
  });

  // Web: React frontend built into the image, served by nginx, proxying /api
  // to the API service so the whole app is one origin (required for passkeys).
  // The exercise pictures/animations ship inside this image.
  services.push({
    type: "app",
    data: {
      serviceName: input.appServiceName,
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      env: [
        `BACKEND=${input.appServiceName}-api`,
        `PORT=3000`,
        `NGINX_PORT=80`,
        `MEDIA_UPLOAD_MAX=48m`,
      ].join("\n"),
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 80,
        },
      ],
    },
  });

  return { services };
}
