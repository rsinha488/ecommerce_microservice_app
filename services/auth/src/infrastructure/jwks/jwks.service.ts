import { Injectable } from '@nestjs/common';
import { generateKeyPairSync } from 'crypto';
import { exportJWK, importJWK, SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const KEY_DIR = path.join(process.cwd(), 'keys');

@Injectable()
export class JwksService {
  private privateJwk: any;
  private publicJwk: any;
  private kid: string;

  constructor() {
    if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR);
    const keyFile = path.join(KEY_DIR, 'private.json');

    if (fs.existsSync(keyFile)) {
      const jwk = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      this.privateJwk = jwk;
    } else {
      const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      // export JWKS via jose
      // we store the private JWK
      (async () => {
        this.privateJwk = await exportJWK(privateKey);
        this.privateJwk.kid = `k-${Date.now()}`;
        fs.writeFileSync(keyFile, JSON.stringify(this.privateJwk, null, 2));
      })();
    }
    this.kid = this.privateJwk?.kid;
  }

  getPublicJwks() {
    const pub = { ...this.privateJwk };
    delete pub.d;
    return { keys: [pub] };
  }

  async signJwt(payload: Record<string, any>, expiresIn = '15m') {
    const alg = 'RS256';
    const pk = await importJWK(this.privateJwk, alg);
    return new SignJWT(payload)
      .setProtectedHeader({ alg, kid: this.privateJwk.kid })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(pk);
  }
}
