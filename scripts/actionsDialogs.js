export
    class DialogActions {
    constructor(title, content) {
        this.content = content;
        this.dialogBase = this.BaseDialog(title, this.content);
    }
    BaseDialog(title, content) {
        let base = {
            title: title,
            content: content,
            close: () => console.log("This always is logged no matter which option is chosen")
        }
        return base;
    }
    async DialogDoorButtons(count, callstr, calldex, callkey) {
        let btnone = this.ButtonStranght(callstr);
        let btntwo = (count[1] !== undefined && count[1] === 'dex') ? this.ButtonTools(calldex) : this.ButtonKey(callkey);
        let btntree = this.ButtonKey(callkey);
        let a;
        if (count.length < 2) a = { buttons: { one: btnone}, default: 'one'};
        if (count.length == 2) a = { buttons: { one: btnone, two: btntwo }, default: 'one' };
        if (count.length > 2) a = { buttons: { one: btnone, two: btntwo, tree: btntree }, default: 'one' };
        this.dialogBase = Object.assign(this.dialogBase, a);
    }
    ButtonStranght(callback) {
        let a = {
            icon: '<i class="fas fa-fist-raised"></i>',
            label: "Força",
            callback: callback
        }
        return a;
    }
    ButtonTools(callback) {
        let a = {
            icon: '<i class="fas fa-user-lock"></i>',
            label: "Ferramenta de ladrão",
            callback: callback
        }
        return a;
    }
    ButtonKey(callback) {
        let a = {
            icon: '<i class="fas fa-key"></i>',
            label: "Chave",
            callback: callback
        }
        return a;
    }
}