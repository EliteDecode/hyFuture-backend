# Letter Scheduling Timezone Issue Analysis

## Problem
When scheduling letters:
- Letter 1: Today at 8pm for tomorrow → Should deliver tomorrow at 8pm
- Letter 2: Today at 9pm for tomorrow → Should deliver tomorrow at 9pm

But they might be received at the same time, suggesting a timezone or date parsing issue.

## Current Implementation

### 1. Date Input (DTO)
```typescript
// src/modules/letters/dto/create-letter.dto.ts
deliveryDate: string; // ISO 8601 format (e.g., "2026-12-25T10:00:00Z")
```

### 2. Date Parsing
```typescript
// src/modules/letters/letters.service.ts:91
deliveryDate: new Date(dto.deliveryDate)
```

### 3. Scheduling Logic
```typescript
// src/modules/letters/queue/letter-queue.service.ts:20-21
const now = new Date();
const delay = deliveryDate.getTime() - now.getTime();
```

### 4. BullMQ Job Scheduling
```typescript
// Uses delay in milliseconds
delay, // milliseconds until delivery
```

## Issues Identified

### Issue 1: Timezone Ambiguity
- If frontend sends `"2025-12-23T20:00:00"` (no timezone), JavaScript interprets in **server's local timezone**
- If frontend sends `"2025-12-23T20:00:00Z"` (UTC), it's interpreted as UTC
- Server timezone might differ from user's timezone

### Issue 2: Date Normalization
- No explicit timezone normalization
- `new Date()` uses server's system timezone
- BullMQ runs in server timezone context

### Issue 3: Potential Date-Only Parsing
- If frontend sends only date (e.g., `"2025-12-23"`), time defaults to `00:00:00`
- Both letters scheduled for "tomorrow" would deliver at midnight

## Solutions

### Solution 1: Ensure UTC Dates (Recommended)
**Frontend should always send dates in UTC with 'Z' suffix:**
```typescript
// Frontend
const deliveryDate = new Date('2025-12-23T20:00:00').toISOString();
// Output: "2025-12-23T20:00:00.000Z"
```

**Backend should normalize to UTC:**
```typescript
// Normalize delivery date to UTC
const deliveryDateUTC = new Date(dto.deliveryDate);
if (isNaN(deliveryDateUTC.getTime())) {
  throw new BadRequestException('Invalid delivery date format');
}
```

### Solution 2: Use Explicit UTC in Scheduling
```typescript
async scheduleLetterDelivery(
  letterId: string,
  deliveryDate: Date,
): Promise<string> {
  // Ensure we're working with UTC timestamps
  const now = new Date();
  const nowUTC = new Date(now.toISOString());
  const deliveryDateUTC = new Date(deliveryDate.toISOString());
  
  const delay = deliveryDateUTC.getTime() - nowUTC.getTime();
  // ... rest of code
}
```

### Solution 3: Add Timezone Validation
```typescript
// Validate that date string includes timezone info
if (!dto.deliveryDate.includes('Z') && !dto.deliveryDate.includes('+') && !dto.deliveryDate.includes('-', 10)) {
  throw new BadRequestException('Delivery date must include timezone (use ISO 8601 with Z or offset)');
}
```

### Solution 4: Store Timezone Info (Advanced)
Add timezone field to Letter model and use it for scheduling:
```prisma
model Letter {
  // ... existing fields
  deliveryDate DateTime
  deliveryTimezone String? // e.g., "America/New_York"
}
```

## Recommended Fix

1. **Frontend**: Always send dates in UTC format with 'Z' suffix
2. **Backend**: Normalize all dates to UTC before scheduling
3. **Validation**: Ensure date strings include timezone information
4. **Logging**: Log both UTC and local times for debugging

## Testing

Test cases to verify:
1. Schedule letter for tomorrow 8pm → Should deliver at exactly tomorrow 8pm UTC
2. Schedule letter for tomorrow 9pm → Should deliver at exactly tomorrow 9pm UTC
3. Check BullMQ job delays match expected times
4. Verify delivery happens at correct time regardless of server timezone

## BullMQ Timezone Behavior

- BullMQ uses **millisecond delays** from current time
- It doesn't have timezone awareness - it's purely time-based
- The delay calculation must account for timezone differences
- Server timezone affects `new Date()` behavior

## Next Steps

1. Check what format frontend is sending dates
2. Add UTC normalization in backend
3. Add timezone validation
4. Add detailed logging for debugging
5. Test with different timezones

