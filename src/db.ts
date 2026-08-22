import { openDB } from 'idb'
import type { GoalVersion, Workout } from './types'
import { initialRuns } from './seed'
const db=openDB('myprime',1,{upgrade(db){db.createObjectStore('workouts',{keyPath:'id'});db.createObjectStore('goals',{keyPath:'weekStart'});db.createObjectStore('meta')}})
export async function bootstrap(){const d=await db;if((await d.get('meta','notes-history-version'))!==2){const tx=d.transaction(['workouts','meta'],'readwrite');initialRuns.forEach(workout=>tx.objectStore('workouts').put(workout));tx.objectStore('meta').put(2,'notes-history-version');await tx.done}}
export async function getWorkouts(){return (await (await db).getAll('workouts') as Workout[]).sort((a,b)=>b.date.localeCompare(a.date))}
export async function saveWorkout(w:Workout){await (await db).put('workouts',w)}
export async function deleteWorkout(id:string){await (await db).delete('workouts',id)}
export async function getGoal(weekStart:string){return (await (await db).get('goals',weekStart) as GoalVersion|undefined)?.goals}
export async function saveGoal(goal:GoalVersion){await (await db).put('goals',goal)}
