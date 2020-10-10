import * as Actions from './scripts/singleActions.js';
import { SetTriggerFlag } from './scripts/SetTriggerFlag.js';

Hooks.once("init", () => {
    game.socket.on(`module.innocenti-actions`, (data) => {
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
    });
});
window.Innocenti = {
    SetFlag: SetTriggerFlag,
    Actions: Actions.MultiActions,
    Checks: Actions.Checks,
    PassiveCheck: Actions.PassivePerception,
    OpenDoor: Actions.OpenDoor,
    CheckItem: Actions.CheckItem,
    PoolCheck: Actions.PoolCheck,
    PoolFlags: Actions.PoolFlags,
};