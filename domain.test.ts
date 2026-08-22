import {describe,expect,it} from 'vitest'
import {parsePace,progress,weekStart} from './domain'
import {defaultGoals} from './types'
describe('week calculations',()=>{it('starts weeks on Monday',()=>expect(weekStart('2026-08-22')).toBe('2026-08-17'));it('does not let extra runs replace strength',()=>expect(progress([{id:'1',type:'run',date:'2026-08-17',createdAt:'',updatedAt:''},{id:'2',type:'run',date:'2026-08-17',createdAt:'',updatedAt:''},{id:'3',type:'run',date:'2026-08-17',createdAt:'',updatedAt:''},{id:'4',type:'run',date:'2026-08-17',createdAt:'',updatedAt:''}],defaultGoals).completed).toBe(3));it('parses pace',()=>expect(parsePace('6:10')).toBe(370))})
