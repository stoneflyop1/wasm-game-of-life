declare module Game {
    export class Universe {
        free(): void;
        
        tick(): void;
        
        reset(): void;
        
        static  new(arg0: number, arg1: number): Universe;
        
        render(): string;
        
        width(): number;
        
        height(): number;
        
        cells(): number;
        
        toggle_cell(arg0: number, arg1: number): void;
        
        set_glider(arg0: number, arg1: number): void;
        
    }
}

    