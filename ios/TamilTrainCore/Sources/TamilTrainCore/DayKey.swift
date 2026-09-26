import Foundation

/// Calendar day in the child's local time zone, "YYYY-MM-DD".
public typealias DayKey = String

public enum Days {
    public static func key(for date: Date = Date(), calendar: Calendar = .current) -> DayKey {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04ld-%02ld-%02ld", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// Whole days between two keys (b - a). Pure arithmetic, so no time-zone or DST surprises.
    public static func between(_ a: DayKey, _ b: DayKey) -> Int {
        ordinal(b) - ordinal(a)
    }

    /// Days since 1970-01-01 for a proleptic Gregorian date (Howard Hinnant's days_from_civil).
    static func ordinal(_ key: DayKey) -> Int {
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return 0 }
        var y = parts[0]
        let m = parts[1], d = parts[2]
        if m <= 2 { y -= 1 }
        let era = (y >= 0 ? y : y - 399) / 400
        let yoe = y - era * 400
        let mp = (m + 9) % 12
        let doy = (153 * mp + 2) / 5 + d - 1
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
        return era * 146_097 + doe - 719_468
    }
}
