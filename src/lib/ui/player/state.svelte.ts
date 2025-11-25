import { API } from "$lib/client"
import { typingSettingsDefault, type TypingSettings, type UserData } from "$lib/types"

export class UserDataSync {
  settings = $state<TypingSettings>(typingSettingsDefault)
  loc = $state<UserData['loc']>(undefined)

  constructor(data: any) {
    this.settings = data.user.data?.typingSettings ?? typingSettingsDefault
    this.loc = data.user.data.loc

    $effect(() => {
      data.user.data = data.user.data || {}
      data.user.data.typingSettings = this.settings
      API.saveUserData({ typingSettings: this.settings })
    })

    $effect(() => {
      data.user.data = data.user.data || {}
      data.user.data.loc = this.loc
      API.saveUserData({ loc: this.loc })
    })
  }
}
