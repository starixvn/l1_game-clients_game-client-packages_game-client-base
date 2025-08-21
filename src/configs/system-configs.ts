export class SystemConfigs {
    static readonly SG = new SystemConfigs("SG", 9999);
    static readonly VG = new SystemConfigs("VG", 99999);

    private constructor(public readonly name: string, public readonly maxBalanceDisplay: number) { }
}
