
import { PosJson } from "./interfaces.js";

export class Pos {
    
    x: number;
    y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    
    copy(): Pos {
        return new Pos(this.x, this.y);
    }
    
    set(pos: Pos): void {
        this.x = pos.x;
        this.y = pos.y;
    }
    
    add(pos: Pos): void {
        this.x += pos.x;
        this.y += pos.y;
    }
    
    subtract(pos: Pos): void {
        this.x -= pos.x;
        this.y -= pos.y;
    }
    
    equals(pos: Pos): boolean {
        return (this.x === pos.x && this.y === pos.y);
    }
    
    isAdjacentTo(pos: Pos): boolean {
        return (Math.abs(this.x - pos.x) + Math.abs(this.y - pos.y) <= 1);
    }
    
    toString(): string {
        return "(" + this.x + ", " + this.y + ")";
    }
    
    toJson(): PosJson {
        return {
            x: this.x,
            y: this.y,
        };
    }
}

export const createPosFromJson = (data: PosJson): Pos => new Pos(data.x, data.y);


