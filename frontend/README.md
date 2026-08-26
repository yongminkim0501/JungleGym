# Jungle GYM Frontend

## Frontend Workflow

project/
├── templates/ # 화면(View)
│ ├── base.html # 공통 HTML 틀
│ │
│ ├── components/ # 공통 UI
│ │ ├── header.html
│ │ ├── navbar.html
│ │ └── modal.html
│ │
│ ├── auth/
│ │ ├── login.html
│ │ ├── signup.html
│ │ └── find-password.html
│ │
│ ├── main/
│ │ └── dashboard.html # 메인·혼잡도·운동 기록
│ │
│ ├── mypage/
│ │ ├── mypage.html
│ │ └── edit-profile.html
│ │
│ └── qr/
│ ├── qr-select.html # 입실·퇴실 선택
│ └── qr-result.html # 처리 결과
│
├── static/
│ ├── css/
│ │ ├── input.css # Tailwind 작성 파일
│ │ └── output.css # Tailwind 빌드 결과
│ │
│ ├── js/
│ │ ├── common.js # 공통 메뉴·모달·유틸리티
│ │ │
│ │ ├── models/ # 데이터 요청·상태 관리
│ │ │ ├── auth-model.js
│ │ │ ├── gym-model.js
│ │ │ └── user-model.js
│ │ │
│ │ ├── views/ # 화면 표시 변경
│ │ │ ├── auth-view.js
│ │ │ ├── dashboard-view.js
│ │ │ └── qr-view.js
│ │ │
│ │ └── controllers/ # 클릭·입력·AJAX 흐름 제어
│ │ ├── auth-controller.js
│ │ ├── dashboard-controller.js
│ │ └── qr-controller.js
│ │
│ └── images/
│ ├── logo.png
│ └── icons/
│
└── tailwind.config.js
