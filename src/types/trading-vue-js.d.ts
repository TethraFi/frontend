declare module 'trading-vue-js' {
    import Vue from 'vue';

    export interface ChartData {
        chart: {
            type: string;
            data: number[][];
            settings?: any;
        };
        onchart?: any[];
        offchart?: any[];
    }

    export class DataCube {
        constructor(data: ChartData);
        data: ChartData;
    }

    export class TradingVue extends Vue {
        static install(vue: typeof Vue): void;
    }

    export interface TradingVueProps {
        data: DataCube | ChartData;
        width?: number;
        height?: number;
        colorBack?: string;
        colorGrid?: string;
        colorText?: string;
        colorTitle?: string;
        colorScale?: string;
        colorCross?: string;
        colorCandleUp?: string;
        colorCandleDw?: string;
        colorWickUp?: string;
        colorWickDw?: string;
        colorVolUp?: string;
        colorVolDw?: string;
        overlays?: any[];
        extensions?: any[];
    }
}
