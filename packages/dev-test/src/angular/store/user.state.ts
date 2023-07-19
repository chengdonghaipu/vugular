import { Action, Getter, State } from '@vugular/store'
import type { StateContext } from '@vugular/store'

export interface UserModel {
  name: string
  age: number
  sex: number
}

export class UpdateUserAge {
  static readonly type = '[User] UpdateUserAge'
  constructor(public age: number) {}
}

@State<UserModel>({
  name: 'User',
  defaults: {
    name: '',
    age: 0,
    sex: 0
  }
})
export class UserState {
  @Getter()
  static getName(state: UserModel) {
    return state.name
  }

  @Getter()
  static sexFormat(state: UserModel): string {
    return state.sex ? '男' : '女'
  }

  @Action(UpdateUserAge)
  updateUserAge(ctx: StateContext<UserModel>, action: UpdateUserAge) {
    ctx.patchState({
      ...ctx.getState(),
      age: action.age
    })
  }
}
