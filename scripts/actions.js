import { SetTriggerFlag } from './SetTriggerFlag.js';
import { addTMFX, removeTMFX } from './tmpx.js';
const sepFlags = ';'; //Separa as opçãoes do flag não pode ser ponto porque ponto introduz os niveis de flag
const sepChecks = '; '; // Separa cada grupo de ação
const sepAction2Param = '.';// separa o action . Parametro. target
const sepParam = sepFlags;  // depois que tirou o parametro separa cada grupo de alvos
const sepTargets = sepFlags; // depara os diversos targets
const sepInParam = '|'; // para separar parametros de cada grupo
export class SetTrigger {
    
    constructor(auser, atoken) {
        this.user = (auser !== '' && auser !== 'None') ? game.users.get(auser.id) : game.user;
        if (atoken) {
            this.token = canvas.tokens.get(atoken.id);
            if (this.token.actor !== null) {
                this.actor = game.actors.find(a => a.id === this.token.actor.id);
            }
        }        
        console.log(this);
    }
    CheckFlag(flags) {
        if (flags !== undefined) {
            let flag = new SetTriggerFlag(this.user.id, this.token.id, ...flags.split(sepFlags));
            if (flag.GetFlag()) return true;
            flag.SetFlag();
        }
        return false;
    }
    async TargetTokens(targetIdOrName) {
        this.targets = [];
        for (let i = 0; i < targetIdOrName.length; i++) {
            if (targetIdOrName[i].toLowerCase() === 'self' || targetIdOrName[i].toLowerCase() === 'player') {
                this.targets.push(this.token);
            } else if (game.scenes.active.getFlag(`world`, `${targetIdOrName[i]}`)) {
                try {
                    let pool = await game.scenes.active.getFlag(`world`, `${targetIdOrName[i]}`);
                    for (let idt in pool) {
                        let tk = await canvas.tokens.placeables.find(t => t.id === idt);
                        if (tk)
                            this.targets.push(tk);
                    }
                } catch (e) { }
            } else {
                let t = await canvas.tokens.placeables.find(a => a.name === targetIdOrName[i]) || targetIdOrName[i];
                this.targets.push(t);
            }
        }
    }
    async ExecuteActions(actions, targets, param) {
        let multparam = (param.length < targets.length) ? Array(targets.length).fill(param[0]) : param;
        this.targets = targets;
        switch (actions) {
            case 'HitTarget':
                await this[actions](targets, ...multparam);
                break;
            case 'PlayTrack':
            case 'ResetFlag':
            case 'ResetMyFlag':
            case 'UnSetSceneFlag':
                await this[actions](...param);
                break;
            case 'None':
            case '':
                break;
            default:
                await this[actions](this.targets, multparam);
        }
    }
    async GMCheck(check) {
        let checkActions = check.split(sepChecks);
        for (let i = 0; i < checkActions.length; i++) {
            let act = checkActions[i].split(sepAction2Param);
            this.action = act.shift();
            let actionParm = act.shift();
            let targetName = act[0];
            this.args = (actionParm !== undefined && actionParm !== '') ? actionParm.split(sepParam) : [actionParm];
            if (targetName !== undefined && targetName.toLowerCase() !== 'none' && targetName !== '')
                await this.TargetTokens(targetName.split(sepTargets));
            else
                this.targets = [this.token];
            await this.ExecuteActions(this.action, this.targets, this.args);
        }
    }
    async GMacro(check) {
        if (game.user.isGM === true) {
            this.GMCheck(check)
        } else {
            game.socket.emit("module.innocenti-actions", { userid: this.user.id, tokenid: this.token.id, check: check });
        }
    }
    async ChangeLebel(target, newLabel) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        //TODO: Mais de um com o mesmo nome corregir
        for (let i = 0; i < target.length; i++) {
            try {
                canvas.drawings.get(target[i]).update({ "text": newLabel });
            } catch (error) { }
            try {
                let dr = canvas.drawings.placeables.find(a => a.data.text === target[i]);
                if (dr)
                    dr.update({ "text": newLabel });
            } catch (error) { }
        }
    }
    async DisableRegion(target, act) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        let toggle = (act === 'toggle') ? true : false;
        let disable = (act === 'true') ? true : false;
        for (let i = 0; i < target.length; i++) {
            try {
                let dr = canvas.drawings.get(target[i]);
                if (!dr)
                    dr = canvas.drawings.placeables.find(a => a.data.text === target[i]);
                if (toggle) {
                    let dflag = dr.getFlag('multilevel - tokens', 'disabled');
                    disable = (dflag == true) ? false: true;
                }
                dr.SetFlag('multilevel - tokens', 'disabled', disable);
            } catch (error) { }
        }
    }
    async ChangeImage(target, newimage) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < target.length; i++) {
            try {
                let baseurl = `uploads-img/${newimage[i]}.png`;
                if (!isUrlFound(`${baseurl}.webp`))
                    if (!isUrlFound(baseurl)) return;
                    else
                        baseurl = baseurl.concat('.webp');
                target[i].update({ "img": baseurl });
            } catch (e) { }
            try {
                let baseurl = `assets/art/${newimage[i]}.png`;
                if (!isUrlFound(`${baseurl}.webp`))
                    if (!isUrlFound(baseurl)) return;
                    else
                        baseurl = baseurl.concat('.webp');
                canvas.tiles.get(target[i]).update({ "img": baseurl });
            } catch (e) { }
        }
    }
    async Hidden(target, hidden) {
        if (target === undefined) return ui.notifications.error("Não há um alvo valido");
        for (let i = 0; i < target.length; i++) {
            let hhidden = (hidden[i] === false || hidden[i] === 'false') ? false : true;
            try {
                target[i].update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.drawings.get(target[i]).update({ "hidden": hhidden });
            } catch (error) { }
            try {
                canvas.tiles.get(target[i]).update({ "hidden": hhidden });
            } catch (error) { }
        }
    }
    async HitTarget(targets, actorTrapName, itemTrapName, tokenTrap) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        let actorTrap = (typeof actorTrapName === 'string') ? game.actors.getName(actorTrapName) : actorTrapName;
        let item = await actorTrap.items.find(t => t.name === itemTrapName);
        if (tokenTrap !== undefined)
            tokenTrap = canvas.tokens.placeables.find(a => a.name == tokenTrap);
        else
            tokenTrap = this.token;
        new MidiQOL.TrapWorkflow(actorTrap, item, targets, tokenTrap.center);
    }
    async ItemGive(targets, itemName) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        if (this.user.isGM === true) return;
        for (let i = 0; i < targets.length; i++) {
            let item;
            let actor = targets[i].actor;

            let collection = itemName[i].split(sepInParam);
            if (collection.length > 1) {
                let comp = `${collection[0]}.${collection[1]}`;
                let itemId = await GetItemIdCompendium(comp, collection[2]);
                try {
                    item = await targets[i].actor.importItemFromCollection(comp, `${itemId._id}`);
                } catch (error) { }
            } else {
                item = await game.items.getName(itemName[i]);
            }
            if (item !== undefined) {
                await actor.createEmbeddedEntity("OwnedItem", item);
                let message = `
            <div class="dnd5e chat-card item-card" data-actor-id="${actor._id}" data-item-id="${item._id}">
                <header class="card-header flexrow">
                    <img src="${item.img}" title="${item.name}" width="36" height="36">
                    <h3 class="item-name">${item.name}</h3>
                </header>
            </div>
            `;
                await setTimeout(function () {
                    canvas.tokens.selectObjects({});
                    ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ token: targets[i], actor: targets[i].actor, scene: canvas.scene }),
                        content: message,
                        flavor: `Um item foi adicionado ao seu inventário`,
                        type: CONST.CHAT_MESSAGE_TYPES.IC,
                        blind: false
                    }, { chatBubble: false });
                }, 500);
            }

        }
    }
    async ItemRemove(targets, itemName) {
        if (targets === undefined) return ui.notifications.error("Não há um alvo valido");
        if (this.user.isGM === true) return;
        for (let i = 0; i < targets.length; i++) {
            let actor = targets[i].actor;
            let item = actor.items.find(a => a.name === itemName[i]);
            let itemEb = actor.getEmbeddedEntity("OwnedItem", item.id);
            if (itemEb.data.quantity - 1 >= 1) {
                let update = { _id: item.id, "data.quantity": itemEb.data.quantity - 1 };
                await actor.updateEmbeddedEntity("OwnedItem", update);
            } else {
                await actor.items.find(a => a.name === itemName[i]).delete();
            }
            let message = `
            <div class="dnd5e chat-card item-card" data-actor-id="${actor._id}" data-item-id="${item._id}">
                <header class="card-header flexrow">
                    <img src="${item.img}" title="${item.name}" width="36" height="36">
                    <h3 class="item-name">${item.name}</h3>
                </header>
            </div>
            `;
            await setTimeout(function () {
                canvas.tokens.selectObjects({});
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: targets[i], actor: targets[i].actor, scene: canvas.scene }),
                    content: message,
                    flavor: `Um item foi removido do seu inventário`,
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                    blind: false
                }, { chatBubble: false });
            }, 500);
        }

    }
    async MoveToken(target, sqmove) {
        let newX = 0;
        let newY = 0;
        let g = canvas.scene.data.grid;
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') return;
            CanvasAnimation.terminateAnimation(`Token.${target[i].id}.animateMovement`);
            let squeres = sqmove[i].split(sepInParam);
            newX = (target[i].data.x + (g * parseInt(squeres[0])));
            newY = (target[i].data.y + (g * parseInt(squeres[1])));
            await target[i].update({ x: newX, y: newY });
        }
        await canvas.pan(newX, newY);
    }
    async FwdMove(target, sqmove) {
        let newX = 0;
        let newY = 0;
        let g = canvas.scene.data.grid;
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') return;
            CanvasAnimation.terminateAnimation(`Token.${target[i].id}.animateMovement`);
            let face = target[i].data.rotation;
            let squeres = sqmove[i].split(sepInParam);
            let mov = [0, 0];
            if (face > -90 && face < 90 || face >= 0 && face > 270) {
                ///console.log("baixo");
                mov[1] = squeres[1];
                if (squeres[0] != 0)
                    mov[0] = squeres[0] * -1;
            }
            if (face > 0 && face < 180 || face < -180 && face > -360) {
                ///console.log("esquerda")
                mov[0] = squeres[1] * -1;
                if (squeres[0] != 0)
                    mov[1] = squeres[0] * -1;
            }
            if (face < -90 && face > -270 || face > 90 && face < 270) {
                ///console.log("cima")
                mov[1] = squeres[1] * -1;
                if (squeres[0] != 0)
                    mov[0] = squeres[1];
            }
            if (face < 0 && face > -180 || face > 180 && face < 360) {
                ///console.log("direita")
                mov[0] = squeres[1];
                if (squeres[0] != 0)
                    mov[1] = squeres[1];
            }
            newX = (target[i].data.x + (g * parseInt(mov[0])));
            newY = (target[i].data.y + (g * parseInt(mov[1])));
            await target[i].update({ x: newX, y: newY });
        }
        await canvas.pan(newX, newY);
    }
    async PauseGame() {
        if (game.paused === false)
            game.togglePause(true, true);
    }
    async Permission(target, nivel = 'observer') {
        for (let i = 0; i < target.length; i++) {
            if (this.user.isGM === true) return;
            if (target[i] === undefined) return ui.notifications.error(`${target[i]} não é um alvo valido`);
            let permission = (nivel[i] === 'owner') ? 3 : (nivel[i] === 'observer') ? 2 : (nivel[i] === 'limited') ? 1 : 0;
            let actor = game.actors.entities.find(a => a.name === target[i].actor.name);
            if (!actor) return ui.notifications.error(`Permission: Actor of ${target[i].name} not found`);
            let newpermissions = duplicate(actor.data.permission);
            newpermissions[`${this.user.id}`] = permission;
            let permissions = new PermissionControl(actor);
            permissions._updateObject(event, newpermissions);
        }
    }
    async PlayTrack(playlist, soundFile, stop = false) {
        if (stop) {
            var playl = game.playlists.find(track => track.data.name === soundFile);
            if (playl.playing) {
                playl.stopAll();
            }
        }
        else
            FurnacePlaylistQoL.PlaySound(playlist, soundFile);
    }
    async ResetMyFlag(flagName, range, trigger) {
        let flag = new SetTriggerFlag(this.user.id, this.token.id, flagName, range, trigger);
        flag.ResetFlag();
    }
    async ResetFlag(flagName, range, trigger) {
        let flag = new SetTriggerFlag(this.user.id, this.token.id, flagName, range, trigger);
        flag.ResetAllFlag();
    }
    async SetDoor(target, actions) {
        for (let i = 0; i < target.length; i++) {
            if (actions[i] === 'open') await canvas.walls.get(target[i]).update({ ds: 1 });
            if (actions[i] === 'close') await canvas.walls.get(target[i]).update({ ds: 0 });
            if (actions[i] === 'lock') await canvas.walls.get(target[i]).update({ ds: 2 });
            if (actions[i] === 'show') await canvas.walls.get(target[i]).update({ door: 1 });
            if (actions[i] === 'toggle') {
                let stat = (canvas.walls.get(target[i]).data.ds === 0) ? 1 : 0;
                await canvas.walls.get(target[i]).update({ ds: stat });
            }
            if (actions[i] === 'toggleLock') {
                let stat = (canvas.walls.get(target[i]).data.ds === 2) ? 1 : 2;
                await canvas.walls.get(target[i]).update({ ds: stat });
            }
        }
    }
    async Talk(target, message, language = 'common', bubble = true) {
        let oldLang = $(`#polyglot select`).val();
        canvas.tokens.selectObjects({});
        for (let i = 0; i < target.length; i++) {
            let msg = message[i].split(sepInParam);
            if (msg.length > 1) {
                message[i] = msg[0];
                language = msg[1] || 'common';
                bubble = msg[2] || true;
            }
            let lang = (language !== undefined && language !== '' && language !== 'custom') ? language : 'common';
            let bub = (bubble !== 'false') ? true : false;

            await setTimeout(function () {
                canvas.tokens.selectObjects({});
                $(`#polyglot select`).val(`${lang}`);
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: target[i], actor: target[i].actor, scene: canvas.scene }),
                    content: `${message[i]}`,
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                    blind: false
                }, { chatBubble: bub });
                $(`#polyglot select`).val(`${oldLang}`);
            }, 500);

        }
    }
    async TMFX(target, filterid) {
        let tile = false;
        let objtile = [];
        for (let i = 0; i < target.length; i++) {
            if (typeof target[i] === 'string') {
                tile = (canvas.tiles.get(target[i])) ? canvas.tiles.get(target[i]) : (canvas.drawings.get(target[i])) ? canvas.drawings.get(target[i]) : false;
                if (tile === false) return;
            } else {
                tile = target[i];
            }
            addTMFX(tile, filterid[i]);
            objtile.push({ tile: tile, filter: filterid[i] });
        }
        await setTimeout(await function () {

            for (let i = 0; i < objtile.length; i++) {
                removeTMFX(objtile[i].tile, objtile[i].filter);
            }
        }, 4 * 1000);
    }
    async UnSetSceneFlag(tokenName, flagName, deep = false, scopeFlag) {
        scopeFlag = (scopeFlag === undefined) ? SCOPE_FLAG : scopeFlag;
        deep = (deep !== 'false') ? true : false;
        for (let flag of game.scenes.active) {
            if (flag.getFlag(`world`, `${scopeFlag}.${flagName}.${tokenName}`)) {
                flag.unsetFlag(`world`, `${scopeFlag}.${flagName}.-=${tokenName}`);
            }
            if (deep !== false) flag.unsetFlag(`world`, `${scopeFlag}.${flagName}`);
        }
    }
}
async function isUrlFound(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache'
        });

        return response.status === 200;

    } catch (error) {
        // console.log(error);
        return false;
    }
}

async function GetItemIdCompendium(cpack, itemName) {
    const pack = game.packs.get(`${cpack}`);
    await pack.getIndex()
    return await pack.index.find(e => e.name === `${itemName}`);
}
