import { describe, it, expect } from "vitest";
import {
  calculateBrakingDistance,
  calculateTargetSpeed,
  updateVehicleSpeed,
  getEffectiveSpeedLimit,
  accelerateVehicle,
} from "../vehicleMotion";

describe("vehicleMotion helpers", () => {
  describe("calculateBrakingDistance", () => {
    it("calculates distance needed to decelerate from current to target speed", () => {
      // From 10 m/s to 0 m/s with deceleration of 2 m/s²
      // d = (v_f² - v_i²) / (2a) = (0 - 100) / (2 * 2) = -100 / 4 = 25m
      const distance = calculateBrakingDistance(10, 0, 2);
      expect(distance).toBeCloseTo(25, 1);
    });

    it("returns zero when current speed equals target speed", () => {
      const distance = calculateBrakingDistance(5, 5, 2);
      expect(distance).toBe(0);
    });

    it("returns zero when current speed is less than target speed", () => {
      const distance = calculateBrakingDistance(3, 5, 2);
      expect(distance).toBe(0);
    });

    it("returns zero when deceleration is zero or negative", () => {
      expect(calculateBrakingDistance(10, 0, 0)).toBe(0);
      expect(calculateBrakingDistance(10, 0, -2)).toBe(0);
    });

    it("calculates partial braking distance to non-zero target speed", () => {
      // From 10 m/s to 5 m/s with deceleration of 2 m/s²
      // d = (25 - 100) / (2 * 2) = -75 / 4 = 18.75m
      const distance = calculateBrakingDistance(10, 5, 2);
      expect(distance).toBeCloseTo(18.75, 1);
    });
  });

  describe("calculateTargetSpeed", () => {
    it("returns max speed when far from destination", () => {
      const currentSpeed = 5;
      const remainingDistance = 100;
      const maxSpeed = 10;
      const acceleration = 2;
      const deceleration = 2;

      const targetSpeed = calculateTargetSpeed(
        currentSpeed,
        remainingDistance,
        maxSpeed,
        acceleration,
        deceleration,
      );

      expect(targetSpeed).toBe(maxSpeed);
    });

    it("calculates braking speed when close to destination", () => {
      const currentSpeed = 10;
      const remainingDistance = 25; // Exactly at braking distance
      const maxSpeed = 10;
      const acceleration = 2;
      const deceleration = 2;

      const targetSpeed = calculateTargetSpeed(
        currentSpeed,
        remainingDistance,
        maxSpeed,
        acceleration,
        deceleration,
      );

      // Should return a speed that allows stopping at destination
      // v = sqrt(2 * a * d) = sqrt(2 * 2 * 25) = sqrt(100) = 10
      expect(targetSpeed).toBeCloseTo(10, 1);
    });

    it("reduces speed progressively as distance decreases", () => {
      const maxSpeed = 10;
      const acceleration = 2;
      const deceleration = 2;

      // At 25m, should be around 10 m/s
      const speed25 = calculateTargetSpeed(10, 25, maxSpeed, acceleration, deceleration);
      expect(speed25).toBeCloseTo(10, 1);

      // At 12.5m, should be around 7.07 m/s
      const speed12 = calculateTargetSpeed(10, 12.5, maxSpeed, acceleration, deceleration);
      expect(speed12).toBeCloseTo(7.07, 1);

      // At 2m, should be around 2.83 m/s
      const speed2 = calculateTargetSpeed(10, 2, maxSpeed, acceleration, deceleration);
      expect(speed2).toBeCloseTo(2.83, 1);

      // At 0.5m, should be around 1.41 m/s
      const speed0_5 = calculateTargetSpeed(10, 0.5, maxSpeed, acceleration, deceleration);
      expect(speed0_5).toBeCloseTo(1.41, 1);
    });

    it("returns zero when remaining distance is zero", () => {
      const targetSpeed = calculateTargetSpeed(5, 0, 10, 2, 2);
      expect(targetSpeed).toBe(0);
    });

    it("never exceeds current speed when braking", () => {
      const currentSpeed = 8;
      const remainingDistance = 10;
      const maxSpeed = 10;
      const acceleration = 2;
      const deceleration = 2;

      const targetSpeed = calculateTargetSpeed(
        currentSpeed,
        remainingDistance,
        maxSpeed,
        acceleration,
        deceleration,
      );

      expect(targetSpeed).toBeLessThanOrEqual(currentSpeed);
    });
  });

  describe("updateVehicleSpeed", () => {
    it("accelerates vehicle when target speed is higher", () => {
      const vehicle = {
        speed: 5,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1; // 1 second
      const targetSpeed = 10;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      // Should increase by accel * dt = 2 * 1 = 2, so 5 + 2 = 7
      expect(newSpeed).toBeCloseTo(7, 1);
      expect(vehicle.speed).toBeCloseTo(7, 1);
    });

    it("decelerates vehicle when target speed is lower", () => {
      const vehicle = {
        speed: 10,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1; // 1 second
      const targetSpeed = 5;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      // Should decrease by accel * dt = 2 * 1 = 2, so 10 - 2 = 8
      expect(newSpeed).toBeCloseTo(8, 1);
      expect(vehicle.speed).toBeCloseTo(8, 1);
    });

    it("does not exceed target speed when accelerating", () => {
      const vehicle = {
        speed: 9,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1;
      const targetSpeed = 10;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      // Would accelerate to 11, but should cap at target of 10
      expect(newSpeed).toBe(10);
      expect(vehicle.speed).toBe(10);
    });

    it("does not go below target speed when decelerating", () => {
      const vehicle = {
        speed: 6,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1;
      const targetSpeed = 5;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      // Would decelerate to 4, but should stop at target of 5
      expect(newSpeed).toBe(5);
      expect(vehicle.speed).toBe(5);
    });

    it("maintains speed when already at target", () => {
      const vehicle = {
        speed: 7,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1;
      const targetSpeed = 7;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      expect(newSpeed).toBe(7);
      expect(vehicle.speed).toBe(7);
    });

    it("handles small time steps correctly", () => {
      const vehicle = {
        speed: 5,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1 / 60; // One frame at 60fps
      const targetSpeed = 10;

      const newSpeed = updateVehicleSpeed(vehicle, targetSpeed, dt);

      // Should increase by 2 * (1/60) = 0.0333...
      expect(newSpeed).toBeCloseTo(5.0333, 3);
    });
  });

  describe("getEffectiveSpeedLimit", () => {
    it("returns edge speed limit when it's lower than vehicle max speed", () => {
      const edgeLimit = 5;
      const vehicleMax = 10;

      const effective = getEffectiveSpeedLimit(edgeLimit, vehicleMax);
      expect(effective).toBe(5);
    });

    it("returns vehicle max speed when it's lower than edge speed limit", () => {
      const edgeLimit = 15;
      const vehicleMax = 10;

      const effective = getEffectiveSpeedLimit(edgeLimit, vehicleMax);
      expect(effective).toBe(10);
    });

    it("returns the same value when both limits are equal", () => {
      const limit = 10;

      const effective = getEffectiveSpeedLimit(limit, limit);
      expect(effective).toBe(10);
    });
  });

  describe("accelerateVehicle (legacy)", () => {
    it("increases vehicle speed by acceleration * dt", () => {
      const vehicle = {
        speed: 5,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1;
      const newSpeed = accelerateVehicle(vehicle, dt);

      expect(newSpeed).toBeCloseTo(7, 1);
      expect(vehicle.speed).toBeCloseTo(7, 1);
    });

    it("caps speed at maxSpeed", () => {
      const vehicle = {
        speed: 9,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1;
      const newSpeed = accelerateVehicle(vehicle, dt);

      expect(newSpeed).toBe(10);
      expect(vehicle.speed).toBe(10);
    });

    it("works with fractional time steps", () => {
      const vehicle = {
        speed: 0,
        accel: 2,
        maxSpeed: 10,
      } as NonNullable<any>;

      const dt = 1 / 60;
      const newSpeed = accelerateVehicle(vehicle, dt);

      expect(newSpeed).toBeCloseTo(0.0333, 3);
    });
  });
});
