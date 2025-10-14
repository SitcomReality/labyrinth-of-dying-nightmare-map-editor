export const NPC_ASSETS = {
    'NPC': {
        type: 'npc',
        npcType: 'generic',
        color: 0xffffff,
        spriteColor: 0x4a9eff,
        propA: '',
        propB: ''
    }
};
export function getNpcConfig(name) {
    return NPC_ASSETS[name] ? { ...NPC_ASSETS[name] } : null;
}