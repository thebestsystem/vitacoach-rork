from playwright.sync_api import sync_playwright

def verify(page):
    # Force navigation to onboarding
    url = "http://localhost:8081/onboarding"
    print(f"Navigating to {url}")
    page.goto(url)

    print("Waiting for content...")
    try:
        # Check for the title we expect
        page.wait_for_selector('text="Votre OS de"', timeout=120000)
        print("Found 'Votre OS de'")
    except Exception as e:
        print("Timeout waiting for text, taking debug screenshot")
        page.screenshot(path="/app/verification/timeout_screenshot.png")
        raise e

    page.screenshot(path="/app/verification/onboarding_screenshot.png")
    print("Screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
