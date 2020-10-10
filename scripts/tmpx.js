export let addTMFX = function (target, filterid) {
    let myFx = TokenMagic.getPreset(filterid);
    TokenMagic.addFilters(target, myFx);
}
export let removeTMFX = function (target, filterid) {
    let myFx = TokenMagic.getPreset(filterid);
    TokenMagic.deleteFilters(target);
}