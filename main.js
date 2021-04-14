import * as MultiActions from './scripts/singleActions.js';
import { SetTriggerFlag } from './scripts/SetTriggerFlag.js';

Hooks.once("init", () => {
    game.socket.on(`module.innocenti-actions`, (data) => {
        if (game.user.isGM) {
            console.log(data);
            let flag = (data.flagRange === 'perScene') ? game.scenes.active : (data.flagRange === 'perUser') ? game.users.get(data.userid) : canvas.tokens.get(data.tokenid);
            if (data.action === 'SetFlag') {
                flag.setFlag(`world`, `${data.scope}.${data.flagName}`, true);
            } else if (data.action === 'ResetFlag') {
                flag.unsetFlag(`world`, `${data.scope}.-=${data.flagName}`);
            } else {
                let actions = new Actions.Checks(data.userid, data.tokenid);
                actions.GMCheck(data.check);
            }
        }
    });
});
window.Innocenti = {
    SetFlag: SetTriggerFlag,
    Actions: MultiActions.Actions,
    Checks: MultiActions.Checks,
    PassiveCheck: MultiActions.PassivePerception,
    OpenDoor: MultiActions.OpenDoor,
    CheckItem: MultiActions.CheckItem,
    PoolCheck: MultiActions.PoolCheck,
    PoolFlags: MultiActions.PoolFlags,
};