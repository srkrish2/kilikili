// swift-tools-version: 5.9
// Platform-neutral logic for Tamil Train: content models, the word-knowledge
// model, the word picker and the trip state machine. No SwiftUI in here, so
// `swift test` runs on a Mac without a simulator.
import PackageDescription

let package = Package(
    name: "TamilTrainCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "TamilTrainCore", targets: ["TamilTrainCore"]),
    ],
    targets: [
        .target(
            name: "TamilTrainCore",
            resources: [.process("Resources")]
        ),
        .testTarget(
            name: "TamilTrainCoreTests",
            dependencies: ["TamilTrainCore"]
        ),
    ]
)
