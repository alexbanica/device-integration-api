export class VentilatorStateDto {
    public isOn: boolean;
    public speed: number;
    public isRotating: boolean;

    public constructor() {
        this.isOn = false;
        this.speed = 1;
        this.isRotating = false;
    }
}