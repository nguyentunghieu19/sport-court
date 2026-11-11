package com.court.backend.service;

public interface VenueImageStorage {
    record StoredImage(String url, String publicId) {}

    StoredImage upload(byte[] content, String format, Long venueId);

    void delete(String publicId);
}
