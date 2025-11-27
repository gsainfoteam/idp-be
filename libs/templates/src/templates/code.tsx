import * as React from 'react';

import Email from './email';

const Code = ({ code }: { code: string }): React.ReactNode => {
  return (
    <Email
      title="인포팀 계정 인증코드"
      preview="인포팀 계정 인증코드"
      description={
        <>
          <span className="text-primary-600 font-bold">인포팀 계정</span> 이메일
          인증번호 전송용 메일입니다.
          <br />
          상기 코드를 입력하여 메일을 인증하여 주시기 바랍니다.
          <br />
          <br />
          <span className="font-bold">중요: </span>이 인증번호는 5분 내에
          만료됩니다. 시간 안에 입력해주세요.
        </>
      }
      code={code}
    />
  );
};

export default Code;
