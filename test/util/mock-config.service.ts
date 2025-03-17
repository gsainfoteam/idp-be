import { TestContainers } from '../setup/singleton';

export class MockConfigService {
  private readonly configMap: Map<string, any> = new Map();

  constructor() {
    // 기본 테스트 설정값 설정
    this.setDefaults();

    // 동적 설정값 추가
    this.setDynamicValues();
  }

  /**
   * 기본 테스트 설정값을 설정합니다.
   */
  private setDefaults(): void {
    // API 및 일반 설정
    this.set('API_VERSION', 'test');
    this.set('BASE_URL', 'http://localhost:3000');

    // JWT 관련 설정
    this.set('JWT_AUDIENCE', 'idp');
    this.set('JWT_EXPIRE', '1h');
    this.set('JWT_ISSUER', 'https://test.idp.gistory.me');
    this.set('JWT_PRIVATE_KEY', 'test-key');
    this.set('JWT_SECRET', 'test-secret');

    // 이메일 기본 설정
    this.set('EMAIL_SERVICE', 'test');
    this.set('EMAIL_USER', 'test@example.com');
    this.set('EMAIL_PASSWORD', 'test');
    this.set('EMAIL_PRIVATE_KEY', 'test-key');
    this.set('EMAIL_SERVICE_CLIENT', 'test-client');
    this.set('EMAIL_ACCESS_URL', 'http://localhost:8080/token');

    // 검증 JWT 설정
    this.set('VERIFICATION_JWT_EXPIRE', '10m');
    this.set('VERIFICATION_JWT_SECRET', 'test-secret');
  }

  /**
   * 테스트 컨테이너에서 동적으로 설정값을 가져와 설정합니다.
   */
  private setDynamicValues(): void {
    try {
      const containers = TestContainers.getInstance();

      // PostgreSQL 설정
      const postgresContainer = containers.postgresContainer;
      this.set(
        'DATABASE_URL',
        `postgres://${postgresContainer.getUsername()}:${postgresContainer.getPassword()}@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/${postgresContainer.getDatabase()}`,
      );

      // Redis 설정
      const redisContainer = containers.redisContainer;
      this.set(
        'REDIS_URL',
        `redis://:${redisContainer.getPassword()}@${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`,
      );

      // GreenMail 설정
      const mailConfig = containers.mailConfig;
      this.set('EMAIL_HOST', mailConfig.host);
      this.set('EMAIL_PORT', mailConfig.smtpPort);
    } catch (error) {
      console.error('테스트 컨테이너 설정 로드에 실패했습니다:', error);
    }
  }

  /**
   * 설정값을 설정합니다.
   */
  set(key: string, value: any): void {
    this.configMap.set(key, value);
  }

  /**
   * 설정값을 가져옵니다.
   */
  get<T>(key: string): T {
    return this.configMap.get(key) as T;
  }

  /**
   * 설정값이 없으면 예외를 발생시킵니다.
   */
  getOrThrow<T>(key: string): T {
    if (!this.configMap.has(key)) {
      throw new Error(`${key} 설정을 찾을 수 없습니다.`);
    }
    return this.configMap.get(key) as T;
  }
}
