/**
 * 체험(프로토타입) 모드: 계정을 만들지 않고 미리 준비된 선생님·학생 계정을 골라 바로 로그인합니다.
 * 실제 운영 시에는 환경 변수 DEMO_LOGIN=off 로 끕니다.
 */
export function demoLoginEnabled(): boolean {
  return process.env.DEMO_LOGIN !== "off";
}

/** 체험용으로 고를 수 있는 시드 계정 */
export const DEMO_USER_IDS = ["u_teacher", "u_student1", "u_student2", "u_student3", "u_student4", "u_student5"];
