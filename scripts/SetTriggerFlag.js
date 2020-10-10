const SCOPE_FLAG = 'worldTrigger';
export class SetTriggerFlag {
    constructor(userid, tokenid, flagname, range, trigger) {
        this.data = {
            userid: userid,
            tokenid: tokenid,
            scope: SCOPE_FLAG,
            flagName: flagname,
            flagRange: (range !== undefined)? range:'perToken',
            flagTrigger: (trigger !== undefined && trigger !== false) ? true : false,
            action: false,
            flag: false
        }
        this.flag = (this.data.flagRange === 'perScene') ? game.scenes.active : (this.data.flagRange === 'perUser') ? game.users.get(this.data.userid) : canvas.tokens.get(this.data.tokenid);
    }

    async SetFlag(flagName) {
        this.data.flagName = (flagName !== undefined) ? flagName : this.data.flagName;
        this.data.action = 'SetFlag';
        console.log(this);
        if (game.user.isGM === true) {
            this.flag.setFlag(`world`, `${this.data.scope}.${this.data.flagName}`, true);
        } else {
            console.log(this.data);
            game.socket.emit("module.innocenti-actions", this.data);
        }
    }

    async ResetFlag(flagName) {
        this.data.flagName = flagName || this.data.flagName;
        this.data.action = 'ResetFlag';
        console.log(this.data);
        if (game.user.isGM === true) {
            this.flag.unsetFlag(`world`, `${this.data.scope}.-=${this.data.flagName}`);
        } else {
            game.socket.emit('module.innocenti-actions', this.data);
        }
    }
    async ResetAllFlag(flagName) {
        this.data.flagName = flagName || this.data.flagName;
        let dataflag = (this.data.flagRange === 'perScene') ? game.scenes.active : (this.data.flagRange === 'perUser') ? game.users : canvas.tokens.placeables;
        this.data.action = 'ResetFlag';
        for (let flag of dataflag) {
            if (flag.getFlag(`world`, `${this.data.scope}.${this.data.flagName}`)) {
                if (game.user.isGM === true) {
                    flag.unsetFlag(`world`, `${this.data.scope}.-=${this.data.flagName}`);
                } else {
                    game.socket.emit('module.innocenti-actions', this.data);
                }
            }
        }
    }
    // todas as checagens sem um range e um trigger vai checar todos os tokens em busca da flag se achar não executa.
    GetFlag(flagName) {
        this.data.flagName = (flagName !== undefined) ? flagName : this.data.flagName;
        if (this.data.flagTrigger) {
            this.flag = (this.data.flagRange === 'perScene') ? game.scenes.active : (this.data.flagRange === 'perUser') ? game.users : canvas.tokens.placeables;
            for (let flag of this.data.flag) {
                let activated = flag.getFlag(`world`, `${this.data.scope}.${this.data.flagName}`) || false;
                if (activated !== false) return activated;
            }
        } else {
            return this.flag.getFlag(`world`, `${this.data.scope}.${this.data.flagName}`) || false;
        }
    }
}