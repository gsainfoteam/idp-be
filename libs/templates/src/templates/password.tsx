import * as React from 'react';

import Email from '../components/email';

const Password = ({ password }: { password: string }): React.ReactNode => {
  return (
    <Email
      title="임시 비밀번호"
      preview="인포팀 계정 임시 비밀번호"
      code={password}
      description={
        <>
          <span className="text-primary-600 font-bold">인포팀 계정</span> 이메일
          임시 비밀번호 전송용 메일입니다.
          <br />
          상기 임시 비밀번호를 입력하여 로그인을 완료해주세요.
          <br />
          <br />
          <span className="font-bold">중요: </span>로그인 후 꼭 비밀번호 변경을
          하여 임시 비밀번호를 제거하세요.
        </>
      }
    />
  );
};

Password.PreviewProps = {
  password: 'hs306hDNbyB448bFBcq4KckA',
};

export default Password;
