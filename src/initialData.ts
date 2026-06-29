import { AppState } from './types';

export const INITIAL_PASTE_TEXT = `기하
예습: 52-57

대수
예습: 유제 16-19, 연습 14-18

조합
복습: 73-78

정수
예습, 복습: 43-47

WT 오답: 3회차 정수 9,10

WT 범위:
기하 : 55,61,65,66p   #31-42

대수 : 1단원 연습문제 1번~18번

정수 : 1단원 연습문제 18~26 , 2단원 개념 및 예제1,2,3

조합 : #65-78

WT 공부 중

기하: done

대수: 1단원 연습 9,16,17

정수: done

조합: done`;

export const INITIAL_APP_STATE: AppState = {
  rawPasteText: INITIAL_PASTE_TEXT,
  lastParsedDate: '2026-06-28 16:36',
  subjects: {
    geometry: {
      subjectId: 'geometry',
      previews: [
        {
          id: 'geo_p_1',
          title: '예습: 52-57p',
          rawText: '52-57',
          problems: [
            { id: 'geo_p_52', label: '52p', isCompleted: true },
            { id: 'geo_p_53', label: '53p', isCompleted: true },
            { id: 'geo_p_54', label: '54p', isCompleted: true },
            { id: 'geo_p_55', label: '55p', isCompleted: true },
            { id: 'geo_p_56', label: '56p', isCompleted: true },
            { id: 'geo_p_57', label: '57p', isCompleted: true },
          ],
        },
      ],
      reviews: [],
      wtScopes: [
        {
          id: 'geo_wt_1',
          title: 'WT 범위: 55, 61, 65, 66p & #31-42',
          rawText: '55,61,65,66p   #31-42',
          problems: [
            { id: 'geo_wt_55p', label: '55p', isCompleted: true },
            { id: 'geo_wt_61p', label: '61p', isCompleted: true },
            { id: 'geo_wt_65p', label: '65p', isCompleted: true },
            { id: 'geo_wt_66p', label: '66p', isCompleted: true },
            { id: 'geo_wt_31', label: '#31', isCompleted: true },
            { id: 'geo_wt_32', label: '#32', isCompleted: true },
            { id: 'geo_wt_33', label: '#33', isCompleted: true },
            { id: 'geo_wt_34', label: '#34', isCompleted: true },
            { id: 'geo_wt_35', label: '#35', isCompleted: true },
            { id: 'geo_wt_36', label: '#36', isCompleted: true },
            { id: 'geo_wt_37', label: '#37', isCompleted: true },
            { id: 'geo_wt_38', label: '#38', isCompleted: true },
            { id: 'geo_wt_39', label: '#39', isCompleted: true },
            { id: 'geo_wt_40', label: '#40', isCompleted: true },
            { id: 'geo_wt_41', label: '#41', isCompleted: true },
            { id: 'geo_wt_42', label: '#42', isCompleted: true },
          ],
        },
      ],
      notes: '기하 작도 주의.',
    },
    algebra: {
      subjectId: 'algebra',
      previews: [
        {
          id: 'alg_p_1',
          title: '예습: 유제 16-19 & 연습 14-18',
          rawText: '유제 16-19, 연습 14-18',
          problems: [
            { id: 'alg_p_u16', label: '유제 16', isCompleted: false },
            { id: 'alg_p_u17', label: '유제 17', isCompleted: false },
            { id: 'alg_p_u18', label: '유제 18', isCompleted: false },
            { id: 'alg_p_u19', label: '유제 19', isCompleted: false },
            { id: 'alg_p_e14', label: '연습 14', isCompleted: false },
            { id: 'alg_p_e15', label: '연습 15', isCompleted: false },
            { id: 'alg_p_e16', label: '연습 16', isCompleted: false },
            { id: 'alg_p_e17', label: '연습 17', isCompleted: false },
            { id: 'alg_p_e18', label: '연습 18', isCompleted: false },
          ],
        },
      ],
      reviews: [],
      wtScopes: [
        {
          id: 'alg_wt_1',
          title: 'WT 범위: 1단원 연습문제 1번~18번',
          rawText: '1단원 연습문제 1번~18번',
          problems: [
            { id: 'alg_wt_1', label: '연습 1', isCompleted: false },
            { id: 'alg_wt_2', label: '연습 2', isCompleted: false },
            { id: 'alg_wt_3', label: '연습 3', isCompleted: false },
            { id: 'alg_wt_4', label: '연습 4', isCompleted: false },
            { id: 'alg_wt_5', label: '연습 5', isCompleted: false },
            { id: 'alg_wt_6', label: '연습 6', isCompleted: false },
            { id: 'alg_wt_7', label: '연습 7', isCompleted: false },
            { id: 'alg_wt_8', label: '연습 8', isCompleted: false },
            { id: 'alg_wt_9', label: '연습 9', isCompleted: true },
            { id: 'alg_wt_10', label: '연습 10', isCompleted: false },
            { id: 'alg_wt_11', label: '연습 11', isCompleted: false },
            { id: 'alg_wt_12', label: '연습 12', isCompleted: false },
            { id: 'alg_wt_13', label: '연습 13', isCompleted: false },
            { id: 'alg_wt_14', label: '연습 14', isCompleted: false },
            { id: 'alg_wt_15', label: '연습 15', isCompleted: false },
            { id: 'alg_wt_16', label: '연습 16', isCompleted: true },
            { id: 'alg_wt_17', label: '연습 17', isCompleted: true },
            { id: 'alg_wt_18', label: '연습 18', isCompleted: false },
          ],
        },
      ],
      notes: '1단원 인수분해 연습문제 고난도 풀이 집중.',
    },
    combinatorics: {
      subjectId: 'combinatorics',
      previews: [],
      reviews: [
        {
          id: 'comb_r_1',
          title: '복습: 73-78번',
          rawText: '73-78',
          problems: [
            { id: 'comb_r_73', label: '#73', isCompleted: true },
            { id: 'comb_r_74', label: '#74', isCompleted: true },
            { id: 'comb_r_75', label: '#75', isCompleted: true },
            { id: 'comb_r_76', label: '#76', isCompleted: true },
            { id: 'comb_r_77', label: '#77', isCompleted: true },
            { id: 'comb_r_78', label: '#78', isCompleted: true },
          ],
        },
      ],
      wtScopes: [
        {
          id: 'comb_wt_1',
          title: 'WT 범위: #65-78번',
          rawText: '#65-78',
          problems: [
            { id: 'comb_wt_65', label: '#65', isCompleted: true },
            { id: 'comb_wt_66', label: '#66', isCompleted: true },
            { id: 'comb_wt_67', label: '#67', isCompleted: true },
            { id: 'comb_wt_68', label: '#68', isCompleted: true },
            { id: 'comb_wt_69', label: '#69', isCompleted: true },
            { id: 'comb_wt_70', label: '#70', isCompleted: true },
            { id: 'comb_wt_71', label: '#71', isCompleted: true },
            { id: 'comb_wt_72', label: '#72', isCompleted: true },
            { id: 'comb_wt_73', label: '#73', isCompleted: true },
            { id: 'comb_wt_74', label: '#74', isCompleted: true },
            { id: 'comb_wt_75', label: '#75', isCompleted: true },
            { id: 'comb_wt_76', label: '#76', isCompleted: true },
            { id: 'comb_wt_77', label: '#77', isCompleted: true },
            { id: 'comb_wt_78', label: '#78', isCompleted: true },
          ],
        },
      ],
      notes: '경우의 수 세기 중복 제거 필수 확인.',
    },
    number_theory: {
      subjectId: 'number_theory',
      previews: [
        {
          id: 'nt_p_1',
          title: '예습 & 복습: 43-47p',
          rawText: '43-47',
          problems: [
            { id: 'nt_p_43', label: '43p', isCompleted: true },
            { id: 'nt_p_44', label: '44p', isCompleted: true },
            { id: 'nt_p_45', label: '45p', isCompleted: true },
            { id: 'nt_p_46', label: '46p', isCompleted: true },
            { id: 'nt_p_47', label: '47p', isCompleted: true },
          ],
        },
      ],
      reviews: [],
      wtScopes: [
        {
          id: 'nt_wt_1',
          title: 'WT 범위: 1단원 연습문제 18~26, 2단원 개념 & 예제 1,2,3',
          rawText: '1단원 연습문제 18~26 , 2단원 개념 및 예제1,2,3',
          problems: [
            { id: 'nt_wt_18', label: '연습 18', isCompleted: true },
            { id: 'nt_wt_19', label: '연습 19', isCompleted: true },
            { id: 'nt_wt_20', label: '연습 20', isCompleted: true },
            { id: 'nt_wt_21', label: '연습 21', isCompleted: true },
            { id: 'nt_wt_22', label: '연습 22', isCompleted: true },
            { id: 'nt_wt_23', label: '연습 23', isCompleted: true },
            { id: 'nt_wt_24', label: '연습 24', isCompleted: true },
            { id: 'nt_wt_25', label: '연습 25', isCompleted: true },
            { id: 'nt_wt_26', label: '연습 26', isCompleted: true },
            { id: 'nt_wt_c2', label: '2단원 개념', isCompleted: true },
            { id: 'nt_wt_e1', label: '예제 1', isCompleted: true },
            { id: 'nt_wt_e2', label: '예제 2', isCompleted: true },
            { id: 'nt_wt_e3', label: '예제 3', isCompleted: true },
          ],
        },
      ],
      notes: '합동식 성질 복습 및 잉여계 정리 숙지하기.',
    },
  },
};
