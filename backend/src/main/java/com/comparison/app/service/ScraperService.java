package com.comparison.app.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Service
public class ScraperService {

    private static final Logger logger = Logger.getLogger(ScraperService.class.getName());
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

    public List<String> scrapeTrustpilot(String query) {
        List<String> reviews = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            String url = "https://www.trustpilot.com/search?query=" + encodedQuery;
            Document doc = Jsoup.connect(url).userAgent(USER_AGENT).get();

            Element firstResult = doc.selectFirst("a[data-business-unit-link]");
            if (firstResult != null) {
                String relativeUrl = firstResult.attr("href");
                String companyUrl = relativeUrl.startsWith("http") ? relativeUrl
                        : "https://www.trustpilot.com" + relativeUrl;

                Document companyDoc = Jsoup.connect(companyUrl).userAgent(USER_AGENT).get();
                Elements reviewElements = companyDoc.select("p[data-typography='body-l']");
                for (Element el : reviewElements) {
                    reviews.add(el.text());
                }
            }
        } catch (IOException e) {
            logger.severe("Error scraping Trustpilot for query: " + query + " - " + e.getMessage());
        }
        return reviews;
    }

    public List<String> scrapeTripAdvisor(String query) {
        List<String> reviews = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            String url = "https://www.tripadvisor.com/Search?q=" + encodedQuery;
            Document doc = Jsoup.connect(url).userAgent(USER_AGENT).get();

            Element firstResult = doc.selectFirst("div.result-title");
            if (firstResult != null) {
                reviews.add("Found result: " + firstResult.text());
            }
        } catch (IOException e) {
            logger.severe("Error scraping TripAdvisor for query: " + query + " - " + e.getMessage());
        }
        return reviews;
    }
}
