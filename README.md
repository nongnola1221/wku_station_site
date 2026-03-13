# WKU Station Reservation Platform

원광대학교 총학생회 스테이션 예약 사이트입니다.  
공개 예약 페이지와 관리자 대시보드를 하나의 앱으로 구성했고, Cloudflare Pages + Pages Functions + D1 기반으로 배포할 수 있도록 설계했습니다.

운영 주소: `https://whu-ch-station.pages.dev`

## Overview

이 프로젝트는 단순 폼 제출형 페이지가 아니라, 실제 운영을 전제로 한 예약 서비스 구조를 목표로 합니다.

- 공개 페이지 `/`
  학생이 날짜, 스테이션, 시간대를 선택하고 예약을 생성합니다.
- 관리자 페이지 `/#admin`
  예약 조회, 시간표 확인, 예약 수정/취소, 시험기간 모드 전환, 서비스 중지/재개, 스테이션별 상태 제어를 처리합니다.

## Core Features

- 스테이션 1~7 예약
- 연속 시간 선택 기반 예약 UI
- 시험기간 24시간 운영 모드
- 일반 운영시간 / 시험기간 운영시간 분리
- 서비스 전체 중지 / 재개
- 스테이션별 개별 중지 / 재개
- 관리자 예약 수정 / 취소
- 사용자 본인 예약 확인 / 취소
- 토큰 기반 내 예약 조회
- 모바일 우선 반응형 UI

## Architecture

### Frontend

- React 19
- Vite
- Framer Motion
- 해시 기반 관리자 진입 (`/#admin`)

### Backend

- Cloudflare Pages Functions
- Cloudflare D1 (SQLite)
- Wrangler CLI 기반 로컬/원격 운용

### Data Model

- `stations`
- `reservations`
- `reservation_slots`
- `settings`
- `admin_users`

## Reservation Integrity

이 서비스의 핵심은 예약 충돌 방지입니다.

- 예약 생성 시 `reservations` 레코드만 저장하지 않습니다.
- 실제 점유 시간은 `reservation_slots` 테이블에 시간 슬롯 단위로 함께 기록합니다.
- `reservation_slots`는 `(reservation_date, station_id, hour_slot)` 기본 키를 사용합니다.
- 따라서 같은 날짜, 같은 스테이션, 같은 시간 슬롯은 DB 레벨에서 중복 저장이 불가능합니다.
- 동시에 여러 사용자가 같은 시간대를 눌러도, 최종적으로 한 요청만 성공하고 나머지는 서버에서 차단됩니다.

## User Flow

1. 스테이션 선택
2. 날짜 및 이용 시간 선택
3. 대표자 정보 입력
4. 개인정보 동의 및 서명 확인
5. 예약 완료 후 브라우저 토큰 기반 내 예약 확인

## Admin Capabilities

- 날짜별 예약 시간표 조회
- 대표자 이름 검색
- 예약 상세 모달에서 시간 / 스테이션 / 인원 수정
- 예약 취소
- 오늘 예약 요약 모달
- 시험기간 모드 토글
- 서비스 중지 사유 설정
- 스테이션별 상태 제어
- 사이트 문구 관리
- 관리자 비밀번호 변경

## Project Structure

```text
src/
  animations/
  components/
  hooks/
  lib/
  pages/
  styles/
  types/
functions/
  _lib/
  api/
migrations/
public/
scripts/
```

## Local Development

```bash
npm install
npm run dev
```

`npm run dev`는 다음 작업을 한 번에 실행합니다.

- 로컬 D1 마이그레이션 적용
- 로컬 D1 시드 적용
- Vite 빌드 watch
- Cloudflare Pages Functions 개발 서버 실행

## Main Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Database Migrations

- `0001_initial.sql`  
  기본 테이블 생성
- `0002_seed.sql`  
  스테이션 / 설정 / 관리자 계정 시드
- `0003_station_blocks.sql`  
  스테이션 개별 중지 필드 추가
- `0004_reservation_access_tokens.sql`  
  사용자 본인 예약 확인용 토큰 저장
- `0005_reservation_slots.sql`  
  시간 슬롯 단위 잠금 테이블 추가

## Deployment

운영 배포는 Cloudflare Pages 프로젝트 `whu-ch-station` 기준으로 진행합니다.

```bash
npm run build
/opt/homebrew/bin/npx wrangler pages deploy dist --project-name whu-ch-station --commit-dirty=true
```

## Notes

- 로컬 개발용 시크릿은 `.dev.vars` 에서 관리합니다.
- 관리자 인증은 해시된 비밀번호와 서명 토큰 기반으로 동작합니다.
- 공개 API는 민감한 개인정보를 노출하지 않도록 분리되어 있습니다.
