import { SetTrigger } from './actions.js';
import { DialogActions } from './actionsDialogs.js';

export class MultiActions extends SetTrigger {
    constructor(userid, tokenid, actions, flags) {
        super(userid, tokenid);
        if (this.CheckFlag(flags)) return;
        this.action = actions.split('; ');
        for (let i = 0; i < this.action.length; i++) {
            this.GMacro(this.action[i]);
        }
    }
}

export class CheckItem extends SetTrigger {
    async Check(itemName, sucess, fail, flags) {
        if (this.CheckFlag(flags)) return;
        let item = this.actor.items.find(a => a.name === itemName);
        if (item) {
            this.GMacro(sucess);
        } else {
            this.GMacro(fail);
        }
    }
}

export class OpenChest extends SetTrigger {
    Check(dificult, sucess, fail, doorKey, flags) {
        if (this.user.isGM === true) return;
        if (this.CheckFlag(flags)) return;
        let cd = (typeof dificult === 'number') ? dificult.toString().split('.') : dificult.split('.');
        let cdPer = (cd[0] !== undefined && cd[0] !== "") ? parseInt(cd[0]) : 12;
        let cdDex = (cd[1] !== undefined && cd[1] !== "") ? parseInt(cd[1]) : 10;
        let button = [];
    }
}

//Checks `dex` 12 `Hidden.Yxyxya.true . PauseGame . Movetoken.xys,xxs.1,2`
export class Checks extends SetTrigger {
    async Check(skill, dificult, sucess, fail, flags) {
        if (this.CheckFlag(flags)) return;
        this.skill = skill.split('.') || false;
        if (!this.skill) return ui.notifications.error("Nenhuma habilidade a ser testada");
        if (dificult !== undefined) {
            this.dificult = (typeof dificult == "number") ? [dificult] : dificult.split('.');
            this.dificult = (this.dificult.length < this.skill.length) ? Array(this.skill.length).fill(this.dificult[0]) : this.dificult;
        } else return ui.notifications.error("Nenhum desafio a ser testada");
        for (let i = 0; i < this.skill.length; i++) {
            if (Object.entries(game.dnd5e.config.skills).map(a => a[0]).includes(this.skill[i])) {
                this.actor.rollSkill(this.skill[i]).then((result) => {
                    if (result.total >= this.dificult[i]) {
                        this.GMacro(sucess);
                    } else {
                        this.GMacro(fail);
                    }
                });
            } else if (Object.entries(game.dnd5e.config.abilities).map(a => a[0]).includes(this.skill[i])) {
                this.actor.rollAbilityTest(this.skill[i]).then((result) => {
                    if (result.total >= this.dificult[i]) {
                        this.GMacro(sucess);
                    } else {
                        this.GMacro(fail);
                    }
                });
            }
        }
    }
}
//Passive 12 `SucessActions.Params . SucessActions2.params.targets` `FailActions.Param1,Param2.TargetName1.TargetName2` `ChatMessage` `Flagname.range.repaet`

// FLAG IDEAL: flagName
export class PassivePerception extends SetTrigger {
    async Check(dificult, sucess, fail, message, flags) {
        if (this.CheckFlag(flags)) return;
        let skillPasssive = this.actor.data.data.skills['prc'].passive;
        if (skillPasssive >= parseInt(dificult)) {
            await this.GMacro(sucess);
            await ChatMessage.create({
                user: ChatMessage.getWhisperRecipients("GM")[0],
                content: `${this.token.name} passou em um teste de "Percepção Passiva".`,
                speaker: ChatMessage.speaker,
                whisper: ChatMessage.getWhisperRecipients("GM"),
                blind: true
            });
            if (message !== undefined && message !== '' && message.toLowerCase() !== 'none') {
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker(),
                    flavor: `Percepção passiva`,
                    content: `${message}`,
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                }, { chatBubble: true });
            }
        } else {
            await this.GMacro(fail);
            await ChatMessage.create({
                user: ChatMessage.getWhisperRecipients("GM")[0],
                content: `${this.token.name} falhou em um teste de Percepção passiva.`,
                speaker: ChatMessage.speaker,
                whisper: ChatMessage.getWhisperRecipients("GM"),
                blind: true
            });
        }
    }
}

export class OpenDoor extends SetTrigger {
    async Check(dificult, sucess, fail, doorKey, flags) {
        if (this.user.isGM === true) return;
        if (this.CheckFlag(flags)) return;
        let cd = (typeof dificult === 'number') ? dificult.toString().split('.') : dificult.split('.');
        let cdStr = (cd[0] !== undefined && cd[0] !== "") ? parseInt(cd[0]) : 12;
        let cdDex = (cd[1] !== undefined && cd[1] !== "") ? parseInt(cd[1]) : 10;
        let button = [];
        //Identificar quantos e quais botões exibir.
        button[0] = 'str';
        let item = this.actor.items.find(a => a.name === `Thieves’ Tools` || a.name === `Ferramenta de Ladino`);
        if (item) button[button.length] = 'dex';
        if (doorKey !== undefined && doorKey !== '') {
            this.key = this.actor.items.find(i => i.name === `${doorKey}`);
            if (this.key) button[button.length] = 'key';
        }
        let dialog = new DialogActions("Tentativa de Abrir Porta", "<p>A Porta está Trancada como você deseja abrir a porta?</p>");
        let callstr = async () => {
            await this.actor.rollAbilityTest(`str`).then((result) => {
                if (result.total >= cdStr) {
                    this.GMacro(sucess);
                } else {
                    this.GMacro(fail);
                }
            });
        };
        let calldex = async () => {
            await item.rollToolCheck().then((result) => {
                if (result.total >= cdDex) {
                    this.GMacro(sucess);
                } else {
                    this.GMacro(fail);
                }
            });
        };
        let callkey = async () => {
            this.GMacro(sucess);
        };
        await dialog.DialogDoorButtons(button, callstr, calldex, callkey);
        console.log(this);
        let d = new Dialog(dialog.dialogBase);
        d.render(true);
    }
}

export class PoolCheck extends SetTrigger {
    async Check(poolname, chance, sucess, fail, flags) {
        if (this.CheckFlag(flags)) return;
        let targets = [];
        try {
            let pool = game.scenes.active.getFlag(`world`, `${poolname}`);
            for (let idt in pool) {
                let tk = canvas.tokens.placeables.find(t => t.id === idt);
                if (tk)
                    targets.push(tk);
            }
        } catch (e) { }
        let r = new Roll(`${chance}`);
        r.roll();
        await AlertWhispGM(this.token.name, `<strong>Roll a ${r.result}</strong> of ${targets.length}`);
        if (r.result >= targets.length) {
            this.GMacro(sucess);
        } else {
            this.GMacro(fail);
        }
    }
}

export class PoolFlags {
    constructor(tokenid, poolname, remove) {
        this.tokenid = tokenid;
        this.poolname = poolname.split('.');
        this.remove = (remove !== undefined && remove !== false) ? true : false;
    }
    async AddPool() {
        for (let i = 0; i < this.poolname.length; i++) {
            try {
                if (!game.scenes.active.getFlag(`world`, `${this.poolname[i]}.${this.tokenid}`))
                    game.scenes.active.setFlag(`world`, `${this.poolname[i]}.${this.tokenid}`, true);
            } catch (e) { }
            await AlertWhispGM(this.tokenid, `join into pool ${this.poolname[i]}`);
        }
    }
    async RemovePool() {
        for (let i = 0; i < this.poolname.length; i++) {
            try {
                game.scenes.active.unsetFlag(`world`, `${this.poolname[i]}.-=${this.tokenid}`);
            } catch (e) { }
            await AlertWhispGM(this.tokenid, `get out pool ${this.poolname[i]}`);
        }
    }

    GetPool(poolname) {
        try {
            return game.scenes.active.getFlag(`world`, `${poolname}`);
        } catch (e) { }
    }
}

async function AlertWhispGM(charName, ckTest) {
    ChatMessage.create({
        user: ChatMessage.getWhisperRecipients("GM")[0],
        content: `${charName} - check: <p> ${ckTest}.</p>`,
        speaker: ChatMessage.speaker,
        whisper: ChatMessage.getWhisperRecipients("GM"),
        blind: true
    });
}