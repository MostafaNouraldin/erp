
    @PostMapping("/auth")
    public ResponseEntity<String> authenticateUser(@RequestBody UserCredentials credentials) {
        // Authentication logic here
        return ResponseEntity.ok("User authenticated successfully!");
    }
    