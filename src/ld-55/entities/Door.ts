import p2, { Body, RotationalSpring } from "p2";
import { Graphics } from "pixi.js";
import Game from "../../core/Game";
import { V, V2d } from "../../core/Vector";
import Entity from "../../core/entity/Entity";
import { degToRad, normalizeAngle } from "../../core/util/MathUtil";
import { CollisionGroups } from "../CollisionGroups";
import { SerializableEntity, SerializedEntity } from "../editor/serializeTypes";
import DampedRotationalSpring from "../../core/physics/DampedRotationalSpring";

export class Door extends SerializableEntity implements Entity {
  //sprite: GameSprite;
  body: Body;
  restAngle: number;

  constructor(
    public hinge: V2d,
    public end: V2d
  ) {
    super();

    this.restAngle = normalizeAngle(end.sub(hinge).angle);

    this.body = new Body({
      mass: 0.5,
      position: hinge.clone(),
      angle: this.restAngle,
    });
    this.body.angle = this.restAngle;

    const width = hinge.sub(end).magnitude;
    const height = 0.3;

    const shape = new p2.Box({ height, width });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Walls; // Don't run into other walls
    this.body.addShape(shape, [width / 2, 0]);

    const graphics = new Graphics();
    // door handle stuff
    const handleX = width - 0.4;
    const handleLength = 0.4;
    const handleThickness = 0.07;
    const stemLengthStickout = 0.1;
    const stemThickness = 0.15;

    graphics
      .rect(0, -height / 2, width, height)
      .fill(0x00bb00)
      // door handle
      // stem
      .rect(
        handleX,
        -height / 2 - stemLengthStickout,
        stemThickness,
        stemLengthStickout
      )
      // handle
      .rect(
        handleX - (handleLength - stemThickness),
        -height / 2 - stemLengthStickout - handleThickness,
        handleLength,
        handleThickness
      )
      .fill(0x999999)
      .rect(handleX, height / 2, stemThickness, stemLengthStickout)
      .rect(
        handleX - (handleLength - stemThickness),
        height / 2 + stemLengthStickout,
        handleLength,
        handleThickness
      )
      .fill(0x999999);

    this.sprite = graphics;
    this.sprite.position.set(...hinge);
    this.sprite.rotation = this.restAngle;
  }

  onAdd(game: Game): void {
    const constraint = new p2.RevoluteConstraint(this.body, game.ground, {
      worldPivot: this.hinge.clone(),
    });
    const swingLimit = degToRad(110);
    // TODO: this breaks because of the angle normalization I think, see if we can fix it
    // constraint.upperLimit = restAngle + swingLimit;
    // constraint.lowerLimit = restAngle - swingLimit;
    // constraint.upperLimitEnabled = true;
    // constraint.lowerLimitEnabled = true;
    this.constraints = [constraint];

    this.springs = [
      new DampedRotationalSpring(game.ground, this.body, {
        worldAnchorA: this.body.position,
        worldAnchorB: this.body.position,
        restAngle: this.restAngle,
        damping: 400,
        stiffness: 800,
        maxTorque: 40,
      }),
    ];
  }

  /** Called every frame, right before rendering */
  onRender(dt: number): void {
    if (this.sprite) {
      this.sprite.position.set(...this.body.position);
      this.sprite.rotation = this.body.angle;
    }
  }

  static deserialize(e: SerializedEntity): Entity {
    return new Door(V(e.hinge), V(e.end));
  }

  serialize(): SerializedEntity {
    return {
      hinge: [...this.hinge],
      end: [...this.end],
    };
  }
}
