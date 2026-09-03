import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";

type Rule =
  | { required?: boolean; message?: string }
  | { minLength?: number; message?: string }
  | { isEmail?: boolean; message?: string }
  | { isString?: boolean; message?: string }
  | { min?: number; message?: string };

type Rules = Record<string, Rule | Rule[]>;

function has(field: any, value: any, message?: string) {
  if (value === undefined || value === null || value === "") {
    throw new ApiError(400, message ?? `${field} is required.`);
  }
}

function applyRule(field: string, value: any, rule: Rule) {
  if ("required" in rule && rule.required) {
    has(field, value, rule.message);
  }
  if ("isString" in rule && rule.isString && typeof value !== "string") {
    throw new ApiError(400, rule.message ?? `${field} must be a string.`);
  }
  if ("isEmail" in rule && rule.isEmail && typeof value === "string") {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      throw new ApiError(400, rule.message ?? `${field} must be a valid email.`);
    }
  }
  if ("minLength" in rule && rule.minLength !== undefined && typeof value === "string") {
    if (value.length < rule.minLength) {
      throw new ApiError(
        400,
        rule.message ?? `${field} must be at least ${rule.minLength} characters.`
      );
    }
  }
}

export function validateBody(rules: Rules) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const body = req.body ?? {};
      for (const [field, ruleOrRules] of Object.entries(rules)) {
        const list = Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
        for (const rule of list) {
          applyRule(field, body[field], rule);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
